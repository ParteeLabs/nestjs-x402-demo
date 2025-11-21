import {
  Body,
  Controller,
  Request,
  Post,
  UseInterceptors,
  HttpException,
} from '@nestjs/common';
import { Request as ExpressRequest } from 'express';
import {
  PricingRequirement,
  X402ApiConfig,
  X402ApiOptions,
  X402DynamicPricing,
  X402Interceptor,
  X402PaymentService,
  X402ReqConfig,
} from 'nestjs-x402';

@Controller('hello')
export class AppController {
  constructor(readonly paymentService: X402PaymentService) {}

  @Post('/static')
  @UseInterceptors(X402Interceptor)
  @X402ApiOptions({
    apiPrices: [
      {
        network: 'base',
        price: '$0.001', // Price in USD
      },
    ],
    description: 'Get a greeting from me!',
    discoverable: true,
    inputSchema: {
      your_name: {
        type: 'string',
        description: 'Your name',
        nullable: false,
      },
      number_of_greetings: {
        type: 'number',
        description: 'Number of greetings you want',
      },
    },
    outputSchema: {
      greeting: {
        type: 'string',
        description: 'The greeting message',
      },
    },
  })
  getStaticHello(@Body() { your_name }: { your_name: string }) {
    return { greeting: `Hello, ${your_name}!` };
  }

  @Post('/dynamic')
  @X402ApiOptions({
    description: 'Get a greeting from me!',
    discoverable: true,
    inputSchema: {
      your_name: {
        type: 'string',
        description: 'Your name',
        nullable: false,
      },
      number_of_greetings: {
        type: 'number',
        description: 'Number of greetings you want',
      },
    },
    outputSchema: {
      greetings: {
        type: 'array',
        description: 'The greeting messages',
        items: { type: 'string' },
      },
    },
  })
  async getDynamicHello(
    @Request() req: ExpressRequest,
    @Body()
    {
      your_name,
      number_of_greetings = 1,
    }: { your_name: string; number_of_greetings: number },
    @X402ReqConfig() x402Config: X402ApiConfig,
  ) {
    const prices: PricingRequirement[] = [
      { price: `$${1 * number_of_greetings}`, network: 'base' },
    ];
    const paymentHeader = req.header('X-PAYMENT');
    if (!paymentHeader) {
      throw new X402DynamicPricing({ dynamicPrices: prices });
    }
    const paymentRequirements = this.paymentService.getExactPaymentRequirements(
      x402Config,
      prices,
    );
    const { valid, x402Response } = await this.paymentService.processPayment({
      paymentRequirements,
      paymentHeader,
    });
    if (!valid) {
      throw new HttpException(x402Response!, 402);
    }

    const greetings = Array.from(
      { length: number_of_greetings },
      () => `Hello, ${your_name}!`,
    );
    return { greetings };
  }
}
