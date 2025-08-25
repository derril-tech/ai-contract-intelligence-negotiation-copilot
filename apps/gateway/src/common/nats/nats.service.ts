import { Injectable, OnModuleDestroy } from '@nestjs/common';
import { connect, NatsConnection, StringCodec, JSONCodec } from 'nats';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class NatsService implements OnModuleDestroy {
  private connection: NatsConnection;
  private stringCodec = StringCodec();
  private jsonCodec = JSONCodec();

  constructor(private configService: ConfigService) {
    this.init();
  }

  private async init() {
    try {
      this.connection = await connect({
        servers: this.configService.get<string>('NATS_URL'),
      });
      console.log('Connected to NATS');
    } catch (error) {
      console.error('Failed to connect to NATS:', error);
    }
  }

  async onModuleDestroy() {
    if (this.connection) {
      await this.connection.close();
    }
  }

  async publish(subject: string, data: any): Promise<void> {
    if (!this.connection) {
      throw new Error('NATS connection not available');
    }
    
    const payload = this.jsonCodec.encode(data);
    this.connection.publish(subject, payload);
  }

  async publishString(subject: string, data: string): Promise<void> {
    if (!this.connection) {
      throw new Error('NATS connection not available');
    }
    
    const payload = this.stringCodec.encode(data);
    this.connection.publish(subject, payload);
  }

  async request(subject: string, data: any, timeout = 5000): Promise<any> {
    if (!this.connection) {
      throw new Error('NATS connection not available');
    }
    
    const payload = this.jsonCodec.encode(data);
    const response = await this.connection.request(subject, payload, { timeout });
    return this.jsonCodec.decode(response.data);
  }

  async subscribe(subject: string, callback: (data: any) => void): Promise<void> {
    if (!this.connection) {
      throw new Error('NATS connection not available');
    }
    
    const subscription = this.connection.subscribe(subject);
    
    for await (const message of subscription) {
      const data = this.jsonCodec.decode(message.data);
      callback(data);
    }
  }
}
