import { PartialType } from '@nestjs/mapped-types';
import { CreatePostDto } from './create-post.dto';
import { IsEnum, IsOptional } from 'class-validator';
import { PostStatus } from '@prisma/client';

export class UpdatePostDto extends PartialType(CreatePostDto) {
  @IsEnum(PostStatus)
  @IsOptional()
  status?: PostStatus;
}
