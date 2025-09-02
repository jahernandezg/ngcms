import { ApiProperty } from '@nestjs/swagger';

export class BlogConfigResponseDto {
  @ApiProperty({ maxLength: 100 }) blogName!: string;
  @ApiProperty({ required: false, maxLength: 255 }) description?: string | null;
  @ApiProperty({ required: false }) siteUrl?: string | null;

  @ApiProperty({ required: false }) logoLight?: string | null;
  @ApiProperty({ required: false }) logoDark?: string | null;
  @ApiProperty({ required: false }) favicon?: string | null;
  @ApiProperty({ required: false }) defaultPostImage?: string | null;

  @ApiProperty({ required: false, maxLength: 160 }) metaDescription?: string | null;
  @ApiProperty({ required: false }) keywords?: string | null;
  @ApiProperty({ required: false }) analyticsId?: string | null;
  @ApiProperty({ required: false }) searchConsoleCode?: string | null;
  @ApiProperty({ required: false }) ogImage?: string | null;

  @ApiProperty({ required: false }) contactEmail?: string | null;
  @ApiProperty({ required: false }) socialTwitter?: string | null;
  @ApiProperty({ required: false }) socialLinkedIn?: string | null;
  @ApiProperty({ required: false }) socialGithub?: string | null;
  @ApiProperty({ required: false }) socialInstagram?: string | null;

  @ApiProperty() locale!: string;
  @ApiProperty() timezone!: string;
  @ApiProperty() postsPerPage!: number;
  @ApiProperty() enableComments!: boolean;
}
