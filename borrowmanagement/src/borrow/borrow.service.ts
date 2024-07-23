import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Neo4jService } from 'nest-neo4j';
import { CreateBorrowDto } from './dto/create-borrow.dto';
import { ClientKafka } from '@nestjs/microservices';
import { DeleteBorrowDto } from './dto/delete-borrow.dto';
import { lastValueFrom } from 'rxjs';

@Injectable()
export class BorrowService {
  constructor(
    @Inject('KAFKA_SERVICE') private readonly kafkaClient: ClientKafka,
    private readonly neo4jService: Neo4jService,
  ) {}

  async onModuleInit() {
    this.kafkaClient.subscribeToResponseOf('check_book_status');
    await this.kafkaClient.connect();
  }

  async create(createBorrowDto: CreateBorrowDto) {
    const { title, borrowerName, borrowDate, returnDate } = createBorrowDto;
    const session = this.neo4jService.getWriteSession();
    const transaction = session.beginTransaction();

    try {
      // Management servisine kitap durumu sorgulama isteği gönder
      const status = await this.checkBookStatus(title);

      if (status === 'borrowed') {
        throw new BadRequestException('Book is already borrowed');
      }

      // Kitap ödünç alma işlemi
      const query = `
        CREATE (borrow:Borrow {title: $title, borrowerName: $borrowerName, borrowDate: $borrowDate, returnDate: $returnDate})
        RETURN borrow
      `;
      const params = { title, borrowerName, borrowDate, returnDate };
      const result = await transaction.run(query, params);
      const borrow = result.records[0].get('borrow').properties;

      // Kitap durumunu güncelle
      const updateQuery = `
        MATCH (book:Book {title: $title})
        SET book.status = 'borrowed'
        RETURN book
      `;
      await transaction.run(updateQuery, { title });

      // Kafka'ya mesaj gönder
      this.kafkaClient.emit('book_borrowed', {
        title: borrow.title,
        borrowerName: borrow.borrowerName,
        borrowDate: borrow.borrowDate,
        returnDate: borrow.returnDate,
      });

      await transaction.commit();
      return borrow;
    } catch (error) {
      await transaction.rollback();
      throw error;
    } finally {
      await session.close();
    }
  }

  async checkBookStatus(title: string): Promise<string> {
    const response = await lastValueFrom(
      this.kafkaClient.send('check_book_status', { title }),
    );

    if (!response) {
      throw new NotFoundException('Book not found in the library');
    }

    return response.status;
  }

  async findAll() {
    const query = `MATCH (borrow:Borrow) RETURN borrow`;
    const result = await this.neo4jService.read(query);
    return result.records.map((record) => record.get('borrow').properties);
  }

  async findOne(title: string) {
    const query = `MATCH (borrow:Borrow {title: $title}) RETURN borrow`;
    const params = { title };
    const result = await this.neo4jService.read(query, params);
    return result.records[0].get('borrow').properties;
  }

  async delete(deleteBorrowDto: DeleteBorrowDto) {
    const { title, borrowerName } = deleteBorrowDto;
    const session = this.neo4jService.getWriteSession();
    const transaction = session.beginTransaction();

    try {
      // Borrow kaydını kontrol et
      const checkBorrowQuery = `
        MATCH (borrow:Borrow {title: $title, borrowerName: $borrowerName})
        RETURN borrow
      `;
      const checkParams = { title, borrowerName };
      const checkResult = await transaction.run(checkBorrowQuery, checkParams);

      if (checkResult.records.length === 0) {
        throw new NotFoundException('Borrow record not found');
      }

      // Borrow kaydını sil
      const deleteBorrowQuery = `
        MATCH (borrow:Borrow {title: $title, borrowerName: $borrowerName})
        DELETE borrow
      `;
      await transaction.run(deleteBorrowQuery, checkParams);

      // Kitap durumunu güncelle
      const updateBookStatusQuery = `
        MATCH (book:Book {title: $title})
        SET book.status = 'available'
        RETURN book
      `;
      await transaction.run(updateBookStatusQuery, { title });

      await transaction.commit();

      // Kafka'ya mesaj gönder
      this.kafkaClient.emit('book_returned', {
        title,
        borrowerName,
      });
    } catch (error) {
      await transaction.rollback();
      throw error;
    } finally {
      await session.close();
    }
  }
}
