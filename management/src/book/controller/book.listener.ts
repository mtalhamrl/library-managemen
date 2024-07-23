import { Controller } from '@nestjs/common';
import { BookService } from '../service/book.service';
import {
  Client,
  ClientKafka,
  MessagePattern,
  Payload,
  Transport,
} from '@nestjs/microservices';
@Controller()
export class BookListener {
  constructor(private readonly bookService: BookService) {}
  @Client({
    transport: Transport.KAFKA,
    options: {
      client: {
        clientId: 'management',
        brokers: ['localhost:9092'],
      },
      consumer: {
        groupId: 'management-consumer',
      },
    },
  })
  private readonly kafkaClient: ClientKafka;

  OnModuleInit() {
    this.kafkaClient.subscribeToResponseOf('book_borrowed');
    this.kafkaClient.subscribeToResponseOf('book_returned');
    this.kafkaClient.subscribeToResponseOf('check_book_status');
    this.kafkaClient.connect();
  }

  @MessagePattern('book_borrowed')
  async handleBookBorrowed(@Payload() message: any) {
    console.log('message', message);
    const { title } = message;
    // Kitap durumu güncelle
    await this.bookService.updateBookStatus(title, 'borrowed');
  }
  @MessagePattern('book_returned')
  async handleBookReturned(@Payload() message: any) {
    console.log('message', message);
    const { title } = message;
    await this.bookService.updateBookStatus(title, 'available');
  }
  @MessagePattern('check_book_status')
  async handleCheckBookStatus(@Payload() message: any) {
    console.log('message', message);
    const { title } = message;
    const status = await this.bookService.findBookStatus(title);
    return { status };
  }
}
