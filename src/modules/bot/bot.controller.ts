import { Body, Controller, Post, UseGuards } from "@nestjs/common";
import { BotService } from "./bot.service";
import { TokenGuard } from "src/common/guards/token.guards";
import { RolesGuard } from "src/common/guards/role.guards";
import { UserRole } from "@prisma/client";
import { Roles } from "src/common/decorators/roles";

@Controller("bot")
@UseGuards(TokenGuard, RolesGuard)
export class BotController {
  constructor(private readonly botService: BotService) {}

  @Post("broadcast")
  @Roles(UserRole.SUPERADMIN, UserRole.ADMIN)
  async broadcastMessage(@Body() body: { telegramIds: string[], message: string }) {
    if (!body.telegramIds || !body.message) {
      return { success: false, message: "Missing required fields" };
    }

    let successCount = 0;
    for (const id of body.telegramIds) {
      if (id) {
        try {
          await this.botService.sendMessage(id, body.message);
          successCount++;
        } catch (e) {
          console.error("Failed to send message to", id, e);
        }
      }
    }

    return {
      success: true,
      message: `Message sent to ${successCount} out of ${body.telegramIds.length} users.`,
    };
  }
}
