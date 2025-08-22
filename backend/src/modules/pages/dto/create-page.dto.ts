import { IsBoolean, IsOptional, IsString, Length, IsEnum } from 'class-validator';
import { PageStatus } from '@prisma/client';

export class CreatePageDto {
  @IsString() @Length(3,200) title!: string;
  @IsString() @Length(3,200) slug!: string;
  @IsString() @Length(10) content!: string;
  @IsOptional() @IsString() excerpt?: string;
  @IsOptional() @IsString() seoTitle?: string;
  @IsOptional() @IsString() seoDescription?: string;
  @IsOptional() @IsString() seoKeywords?: string;
  @IsOptional() @IsString() featuredImage?: string;
  @IsOptional() @IsBoolean() isHomepage?: boolean;
  @IsOptional() @IsEnum(PageStatus) status?: PageStatus;
}
