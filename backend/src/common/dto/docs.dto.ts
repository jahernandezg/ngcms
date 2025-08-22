import { ApiProperty } from '@nestjs/swagger';

export class AuthorDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  name!: string;
}

export class CategoryDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  name!: string;

  @ApiProperty()
  slug!: string;
}

export class TagDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  name!: string;

  @ApiProperty()
  slug!: string;
}

export class PostListItemDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  title!: string;

  @ApiProperty()
  slug!: string;

  @ApiProperty({ required: false, nullable: true })
  excerpt?: string | null;

  @ApiProperty()
  readingTime!: number;

  @ApiProperty({ required: false, nullable: true })
  publishedAt?: string | null;

  @ApiProperty({ type: AuthorDto })
  author!: AuthorDto;

  @ApiProperty({ type: CategoryDto, isArray: true })
  categories!: CategoryDto[];
}

export class PostDetailDto extends PostListItemDto {
  @ApiProperty()
  content!: string;

  @ApiProperty()
  viewCount!: number;

  @ApiProperty({ type: TagDto, isArray: true })
  tags!: TagDto[];
}
