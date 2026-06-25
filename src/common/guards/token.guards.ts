import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";

@Injectable()
export class TokenGuard implements CanActivate {
  constructor(private jwtServise: JwtService) {}
  async canActivate(context: ExecutionContext): Promise<boolean> {
    try {
      const host = context.switchToHttp();
      const req = host.getRequest();
      
      let token = req.cookies?.token;
      
      if (!token && req.headers.authorization) {
        token = req.headers.authorization.split(" ")[1];
      }

      if (!token) {
        throw new UnauthorizedException("Token not provided");
      }

      const user = await this.jwtServise.verify(token);
      req["user"] = user;
      return true;
    } catch (error) {
      throw new UnauthorizedException(error.message);
    }
  }
}
