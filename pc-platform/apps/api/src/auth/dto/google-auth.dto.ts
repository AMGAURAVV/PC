import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class GoogleAuthDto {
  @ApiProperty({
    description: 'Google ID token issued by Google Sign-In on client side',
    example: 'eyJhbGciOiJSUzI1NiIsImtpZCI6Ij...id_token',
  })
  @IsString()
  @IsNotEmpty()
  idToken!: string;
}
