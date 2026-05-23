import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";

@Injectable() 
export class AuthGuard implements CanActivate{
    constructor(private jwtService : JwtService){}

    async canActivate(context: ExecutionContext):Promise<boolean>  {
        try {
            const req = context.switchToHttp().getRequest()

            let token = req.headers.authorization
            if(!token) throw new UnauthorizedException()
            
            token = token.split(" ")[1]

            let user = await this.jwtService.verify(token)

            req["user"] = user

            return true
        } catch (error) {
            throw new UnauthorizedException()
        }
    }
}