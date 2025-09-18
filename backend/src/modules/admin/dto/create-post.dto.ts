import { IsArray, IsEnum, IsOptional, IsString, MinLength, MaxLength, Matches } from 'class-validator';
import { PostStatus } from '@prisma/client';

export class CreatePostDto {
  @IsString()
  @MinLength(3)
  title!: string;

  @IsString()
  @MinLength(10)
  content!: string;

  @IsString()
  @IsOptional()
  @MaxLength(500)
  excerpt?: string; // resumen opcional

  @IsEnum(PostStatus)
  status: PostStatus = PostStatus.DRAFT;

  // Permitimos URL absoluta http(s) o ruta relativa local que comience por /uploads/
  @Matches(/^(https?:\/\/|\/uploads\/).+$/, { message: 'featuredImage debe ser URL http(s) válida o ruta /uploads/…' })
  @IsOptional()
  featuredImage?: string;

  @IsArray()
  @IsOptional()
  categories?: string[]; // slugs

  @IsArray()
  @IsOptional()
  tags?: string[]; // slugs
}
