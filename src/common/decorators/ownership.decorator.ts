import { SetMetadata } from "@nestjs/common";
import { OwnershipMetadata } from "../guards/ownership.guard";

export const Ownership = (metadata: OwnershipMetadata) => SetMetadata("ownership", metadata);