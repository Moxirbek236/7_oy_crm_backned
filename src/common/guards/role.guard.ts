import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { Role } from "@prisma/client";

/**
 * Role Hierarchy:
 * SUPERADMIN > ADMIN > TEACHER > STUDENT
 * 
 * SUPERADMIN can access everything
 * ADMIN can access ADMIN and below endpoints
 * TEACHER can access TEACHER and STUDENT endpoints
 * STUDENT can only access STUDENT endpoints
 */
const ROLE_HIERARCHY: Record<Role, number> = {
    [Role.SUPERADMIN]: 4,
    [Role.ADMIN]: 3,
    [Role.TEACHER]: 2,
    [Role.STUDENT]: 1,
};

@Injectable()
export class RolesGuard implements CanActivate {
    constructor(private reflector: Reflector) { }

    canActivate(context: ExecutionContext): boolean {
        const requiredRoles = this.reflector.getAllAndOverride<Role[]>("roles", [
            context.getHandler(),
            context.getClass(),
        ]);

        // If no roles are required, allow access
        if (!requiredRoles || requiredRoles.length === 0) {
            return true;
        }

        const req = context.switchToHttp().getRequest();
        const user = req['user'];

        if (!user || !user.role) {
            throw new ForbiddenException("Access denied: User not authenticated properly");
        }

        const userRoleLevel = ROLE_HIERARCHY[user.role];
        if (userRoleLevel === undefined) {
            throw new ForbiddenException(`Access denied: Unknown role '${user.role}'`);
        }

        // Check if user has at least one of the required roles
        const hasAccess = requiredRoles.some(requiredRole => {
            const requiredLevel = ROLE_HIERARCHY[requiredRole];
            return userRoleLevel >= requiredLevel;
        });

        if (!hasAccess) {
            const roleNames = requiredRoles.join(', ');
            throw new ForbiddenException(
                `Access denied: Your role '${user.role}' does not have permission. Required roles: ${roleNames}`
            );
        }

        return true;
    }
}