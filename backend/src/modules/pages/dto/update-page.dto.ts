import { IsBoolean, IsOptional, IsString, Length, IsEnum } from 'class-validator';
import { PageStatus } from '@prisma/client';

export class UpdatePageDto {
	@IsOptional() @IsString() @Length(3,200) title?: string;
	@IsOptional() @IsString() @Length(3,200) slug?: string;
	// Para actualización permitimos contenido vacío opcionalmente (si sólo se cambia metadata)
	@IsOptional() @IsString() @Length(0, 100000) content?: string;
	@IsOptional() @IsString() excerpt?: string;
	@IsOptional() @IsString() seoTitle?: string;
	@IsOptional() @IsString() seoDescription?: string;
	@IsOptional() @IsString() seoKeywords?: string;
	@IsOptional() @IsString() featuredImage?: string;
	@IsOptional() @IsBoolean() isHomepage?: boolean;
		@IsOptional() @IsEnum(PageStatus) status?: PageStatus;
}
