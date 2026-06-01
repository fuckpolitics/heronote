import { IsEmail, IsOptional, IsString, MinLength, MaxLength } from "class-validator";

export class RegisterDto {
  @IsEmail({}, { message: "Некорректный email" })
  email!: string;

  @IsString()
  @MinLength(6, { message: "Пароль минимум 6 символов" })
  @MaxLength(100)
  password!: string;

  @IsString()
  @MinLength(1)
  @MaxLength(40)
  name!: string;
}

export class LoginDto {
  @IsEmail({}, { message: "Некорректный email" })
  email!: string;

  @IsString()
  @MinLength(1)
  password!: string;
}

export class UpdateMeDto {
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(40)
  name?: string;

  // Эмодзи или сжатый data URL (картинка ~128px)
  @IsOptional()
  @IsString()
  @MaxLength(400000)
  avatar?: string;
}
