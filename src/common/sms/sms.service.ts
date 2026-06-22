import {
  Injectable,
  InternalServerErrorException,
  Logger,
  OnModuleInit,
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import axios, { AxiosInstance, AxiosError } from "axios";
import { ISmsService, EskizLoginResponse } from "./sms.interface";

// ─── Constants ────────────────────────────────────────────────────────────────

const BASE_URL              = "https://notify.eskiz.uz/api";
const SENDER_ID             = "4546";
const TOKEN_REFRESH_MS      = 20 * 24 * 60 * 60 * 1000; // 20 kun (setInterval max ~24.8 kun)

// ─── Service ──────────────────────────────────────────────────────────────────

@Injectable()
export class EskizService implements ISmsService, OnModuleInit {
  private readonly logger = new Logger(EskizService.name);

  private readonly http: AxiosInstance = axios.create({
    baseURL: BASE_URL,
    timeout: 10_000,
  });

  private token: string | null = null;

  /** Race condition oldini olish uchun login mutex */
  private loginPromise: Promise<string> | null = null;

  private refreshTimer: NodeJS.Timeout | null = null;

  constructor(private readonly config: ConfigService) {}

  // ── Lifecycle ──────────────────────────────────────────────────────────────

  async onModuleInit(): Promise<void> {
    await this.login();
    this.scheduleTokenRefresh();
  }

  // ── Public ─────────────────────────────────────────────────────────────────

  async sendSms(phone: string, message: string): Promise<void> {
    await this.sendWithRetry(phone, message);
  }

  // ── Private ────────────────────────────────────────────────────────────────

  private async sendWithRetry(
    phone: string,
    message: string,
    attempt = 1,
  ): Promise<void> {
    const token = await this.ensureToken();

    try {
      await this.http.post(
        "/message/sms/send",
        { mobile_phone: phone, message, from: SENDER_ID },
        { headers: { Authorization: `Bearer ${token}` } },
      );
    } catch (err) {
      const status = (err as AxiosError).response?.status;

      if (status === 401 && attempt === 1) {
        this.logger.warn("Eskiz token expired, refreshing...");
        this.token = null;
        return this.sendWithRetry(phone, message, 2);
      }

      this.logger.error(
        `SMS send failed (attempt ${attempt}) → ${phone}: ${JSON.stringify((err as AxiosError).response?.data)}`,
      );
      throw new InternalServerErrorException(
        "Failed to send SMS. Please try again later.",
      );
    }
  }

  private async ensureToken(): Promise<string> {
    if (this.token) return this.token;
    return this.login();
  }

  private async login(): Promise<string> {
    if (this.loginPromise) return this.loginPromise;

    this.loginPromise = this.doLogin().finally(() => {
      this.loginPromise = null;
    });

    return this.loginPromise;
  }

  private async doLogin(): Promise<string> {
    const email    = this.config.getOrThrow<string>("ESKIZ_EMAIL");
    const password = this.config.getOrThrow<string>("ESKIZ_PASSWORD");

    try {
      const { data } = await this.http.post<EskizLoginResponse>("/auth/login", {
        email,
        password,
      });

      this.token = data.data.token;
      this.logger.log("Eskiz token refreshed");
      return this.token;
    } catch (err) {
      this.logger.error(
        `Eskiz login failed: ${JSON.stringify((err as AxiosError).response?.data)}`,
      );
      throw new InternalServerErrorException(
        "SMS service authentication failed.",
      );
    }
  }

  private scheduleTokenRefresh(): void {
    this.refreshTimer = setInterval(async () => {
      this.logger.log("Scheduled Eskiz token refresh...");
      this.token = null;
      await this.login().catch((err) =>
        this.logger.error("Scheduled token refresh failed", err),
      );
    }, TOKEN_REFRESH_MS);

    this.refreshTimer.unref?.();
  }
}