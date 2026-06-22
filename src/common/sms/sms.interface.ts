export interface ISmsService {
  sendSms(phone: string, message: string): Promise<void>;
}

export interface EskizLoginResponse {
  data: { token: string };
}