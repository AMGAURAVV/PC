import {
  Controller,
  Post,
  Delete,
  Param,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
  UseGuards,
  Query,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiBearerAuth, ApiBody, ApiConsumes, ApiOperation, ApiTags } from '@nestjs/swagger';

import { Roles } from '../common/decorators/roles.decorator';
import { RolesGuard } from '../common/guards/roles.guard';

import { StorageService } from './storage.service';

@ApiTags('storage')
@Controller('storage')
export class StorageController {
  constructor(private readonly storageService: StorageService) {}

  @Post('upload')
  @ApiBearerAuth('access-token')
  @UseGuards(RolesGuard)
  @Roles('admin', 'staff', 'editor')
  @ApiOperation({ summary: 'Upload an image or asset to the active object storage provider' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
        },
        folder: {
          type: 'string',
          example: 'products',
        },
      },
    },
  })
  @UseInterceptors(
    FileInterceptor('file', {
      limits: {
        fileSize: 10 * 1024 * 1024, // 10MB limit to prevent DoS
      },
      fileFilter: (_req, file, callback) => {
        const allowedMimes = [
          'image/jpeg',
          'image/png',
          'image/webp',
          'image/gif',
          'application/pdf',
        ];
        if (!allowedMimes.includes(file.mimetype.toLowerCase())) {
          return callback(
            new BadRequestException(
              `Invalid file type "${file.mimetype}". Allowed types: JPEG, PNG, WEBP, GIF, PDF`,
            ),
            false,
          );
        }
        callback(null, true);
      },
    }),
  )
  async uploadFile(
    @UploadedFile() file: any,
    @Query('folder') folder?: string,
  ) {
    if (!file) {
      throw new BadRequestException('File is required for upload');
    }

    // Sanitize folder to prevent directory traversal
    const rawFolder = folder || 'general';
    const targetFolder = rawFolder.replace(/[^a-zA-Z0-9_-]/g, '') || 'general';
    const result = await this.storageService.uploadFile(
      file.buffer,
      file.originalname || 'upload.jpg',
      targetFolder,
      file.mimetype,
    );

    return {
      success: true,
      provider: this.storageService.activeProviderName,
      ...result,
    };
  }

  @Delete(':key(*)')
  @ApiBearerAuth('access-token')
  @UseGuards(RolesGuard)
  @Roles('admin', 'staff')
  @ApiOperation({ summary: 'Delete an object from storage by storage key' })
  async deleteFile(@Param('key') key: string) {
    const success = await this.storageService.deleteFile(key);
    return { success, storageKey: key };
  }
}
