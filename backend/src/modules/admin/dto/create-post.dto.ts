import { IsArray, IsEnum, IsOptional, IsString, MinLength, MaxLength } from 'class-validator';
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

  @IsArray()
  @IsOptional()
  categories?: string[]; // slugs

  @IsArray()
  @IsOptional()
  tags?: string[]; // slugs
}
