import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { facilitator } from '@coinbase/x402';
import { X402Module } from 'nestjs-x402';

import { AppController } from './app.controller';

@Module({
  imports: [
    ConfigModule.forRoot(),
    X402Module.registerAsync({
      global: true,
      useFactory: (configService: ConfigService) => ({
        x402Version: 1,
        recipients: [
          {
            network: 'base',
            payTo: configService.get<string>('X402_PAY_TO')!,
          },
        ],
        resource: configService.get<string>('X402_RESOURCE')!,
        facilitator,
      }),
      inject: [ConfigService],
      imports: [ConfigModule],
    }),
  ],
  controllers: [AppController],
})
export class AppModule {}
