import { IsOptional, IsString, MaxLength, MinLength } from "class-validator";

export class CreateFeedDto {
  @IsString()
  @MaxLength(20)
  type!: string;

  @IsString()
  @MinLength(1)
  @MaxLength(140)
  title!: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  detail?: string;

  @IsOptional()
  @IsString()
  @MaxLength(8)
  icon?: string;

  @IsOptional()
  @IsString()
  @MaxLength(16)
  color?: string;
}
