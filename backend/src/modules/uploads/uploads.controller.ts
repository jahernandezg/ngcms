import { Controller, Post, Param, UploadedFile, UseGuards, UseInterceptors, BadRequestException, Delete } from '@nestjs/common';
type MulterFile = { buffer: Buffer; originalname: string; mimetype: string };
import { FileInterceptor } from '@nestjs/platform-express';
import { JwtAuthGuard } from '../admin/guards/jwt-auth.guard';
import { RolesGuard } from '../admin/guards/roles.guard';
import { Roles } from '../admin/decorators/roles.decorator';
import { UploadsService, UploadType } from './uploads.service';
import { AspectRatioValidationPipe } from './pipes/aspect-ratio-validation.pipe';

@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN')
@Controller('admin/uploads')
export class UploadsController {
  constructor(private svc: UploadsService) {}

  @Post(':type')
  @UseInterceptors(FileInterceptor('file'))
  async upload(@Param('type') type: string, @UploadedFile() file?: MulterFile) {
    const t = (type as UploadType);
    if (!file) throw new BadRequestException('Archivo requerido (campo "file")');
    return this.svc.handleUpload(t, file);
  }

  // Endpoint especializado para post-image (usa validación aspect ratio y retorna metadata extendida)
  @Post('post-image/single')
  @UseInterceptors(FileInterceptor('file'))
  async uploadPostImage(@UploadedFile(AspectRatioValidationPipe) file?: MulterFile) {
    if (!file) throw new BadRequestException('Archivo requerido (campo "file")');
    return this.svc.handlePostImageUpload(file);
  }

  @Delete(':type/:filename')
  async remove(@Param('type') type: string, @Param('filename') filename: string) {
    const t = (type as UploadType);
    return this.svc.deleteFile(t, filename);
  }
}
