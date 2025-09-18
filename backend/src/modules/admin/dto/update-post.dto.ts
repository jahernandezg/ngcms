import { PartialType } from '@nestjs/mapped-types';
import { CreatePostDto } from './create-post.dto';
import { IsEnum, IsOptional, Matches } from 'class-validator';
import { PostStatus } from '@prisma/client';

export class UpdatePostDto extends PartialType(CreatePostDto) {
  @IsEnum(PostStatus)
  @IsOptional()
  status?: PostStatus;

  @Matches(/^(https?:\/\/|\/uploads\/).+$/, { message: 'featuredImage debe ser URL http(s) válida o ruta /uploads/…' })
  @IsOptional()
  featuredImage?: string;
}
