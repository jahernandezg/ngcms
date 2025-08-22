import { IsBoolean, IsEnum, IsNotEmpty, IsNumber, IsOptional, IsString, ValidateIf } from 'class-validator';
import { MenuItemType } from '@prisma/client';

export class CreateMenuItemDto {
  @IsString() @IsNotEmpty() title!: string;
  @IsEnum(MenuItemType) type!: MenuItemType;
  @ValidateIf(o => o.type === 'EXTERNAL_LINK') @IsString() @IsNotEmpty() url?: string;
  @ValidateIf(o => ['PAGE','POST','CATEGORY'].includes(o.type)) @IsString() @IsNotEmpty() targetId?: string;
  @IsOptional() @IsString() parentId?: string;
  @IsOptional() @IsNumber() sortOrder?: number;
  @IsOptional() @IsBoolean() isVisible?: boolean;
  @IsOptional() @IsBoolean() openNewWindow?: boolean;
  @IsOptional() @IsString() slug?: string; // permitir slug manual
}

export class UpdateMenuItemDto {
  @IsOptional() @IsString() title?: string;
  @IsOptional() @IsEnum(MenuItemType) type?: MenuItemType;
  @ValidateIf(o => o.type === 'EXTERNAL_LINK') @IsString() @IsNotEmpty() url?: string;
  @ValidateIf(o => ['PAGE','POST','CATEGORY'].includes(o.type || '')) @IsString() @IsNotEmpty() targetId?: string;
  @IsOptional() @IsString() parentId?: string;
  @IsOptional() @IsNumber() sortOrder?: number;
  @IsOptional() @IsBoolean() isVisible?: boolean;
  @IsOptional() @IsBoolean() openNewWindow?: boolean;
  @IsOptional() @IsString() slug?: string;
}
