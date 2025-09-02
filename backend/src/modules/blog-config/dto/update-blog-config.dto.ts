import { IsBoolean, IsEmail, IsInt, IsOptional, IsString, IsUrl, Length, Max, Min, Matches } from 'class-validator';
import { Transform } from 'class-transformer';

export class UpdateBlogConfigDto {
  @IsOptional() @IsString() @Length(1, 100) blogName?: string;
  @IsOptional() @IsString() @Length(0, 255) description?: string | null;
  @IsOptional()
  @Transform(({ value }) => {
    if (value === null || value === undefined) return undefined;
    if (typeof value === 'string') {
      const v = value.trim();
      return v === '' ? undefined : v;
    }
    return value;
  })
  @IsUrl({ require_tld: false, require_protocol: true })
  siteUrl?: string | null;

  @IsOptional() @IsString() logoLight?: string | null;
  @IsOptional() @IsString() logoDark?: string | null;
  @IsOptional() @IsString() favicon?: string | null;
  @IsOptional() @IsString() defaultPostImage?: string | null;

  @IsOptional() @IsString() @Length(0, 160) metaDescription?: string | null;
  @IsOptional() @IsString() keywords?: string | null;
  @IsOptional() @IsString() @Length(0, 50) @Matches(/^G-[A-Z0-9]{8,}$/,{ message: 'analyticsId debe ser un GA4 válido (p.ej. G-XXXXXXX)' }) analyticsId?: string | null;
  @IsOptional() @IsString() searchConsoleCode?: string | null;
  @IsOptional() @IsString() ogImage?: string | null;

  @IsOptional()
  @Transform(({ value }) => {
    if (value === null || value === undefined) return undefined;
    if (typeof value === 'string') { const v = value.trim(); return v === '' ? undefined : v; }
    return value;
  })
  @IsEmail()
  contactEmail?: string | null;
  @IsOptional()
  @Transform(({ value }) => {
    if (value === null || value === undefined) return undefined;
    if (typeof value === 'string') { const v = value.trim(); return v === '' ? undefined : v; }
    return value;
  })
  @IsUrl()
  socialTwitter?: string | null;
  @IsOptional()
  @Transform(({ value }) => {
    if (value === null || value === undefined) return undefined;
    if (typeof value === 'string') { const v = value.trim(); return v === '' ? undefined : v; }
    return value;
  })
  @IsUrl()
  socialLinkedIn?: string | null;
  @IsOptional()
  @Transform(({ value }) => {
    if (value === null || value === undefined) return undefined;
    if (typeof value === 'string') { const v = value.trim(); return v === '' ? undefined : v; }
    return value;
  })
  @IsUrl()
  socialGithub?: string | null;
  @IsOptional()
  @Transform(({ value }) => {
    if (value === null || value === undefined) return undefined;
    if (typeof value === 'string') { const v = value.trim(); return v === '' ? undefined : v; }
    return value;
  })
  @IsUrl()
  socialInstagram?: string | null;

  @IsOptional() @IsString() @Length(2, 10) locale?: string;
  @IsOptional() @IsString() @Length(2, 50) timezone?: string;
  @IsOptional() @IsInt() @Min(5) @Max(50) postsPerPage?: number;
  @IsOptional() @IsBoolean() enableComments?: boolean;
}
