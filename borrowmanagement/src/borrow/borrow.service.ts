import { Inject, Injectable } from '@nestjs/common';
import { Neo4jService } from 'nest-neo4j';
import { CreateBorrowDto } from './dto/create-borrow.dto';
import { ClientKafka } from '@nestjs/microservices';

@Injectable()
export class BorrowService {
  constructor(
    @Inject('KAFKA_SERVICE') private readonly kafkaClient: ClientKafka,
    private readonly neo4jService: Neo4jService,
  ) {}

  async create(createBorrowDto: CreateBorrowDto) {
    const { title, borrowerName, borrowDate, returnDate } = createBorrowDto;
    const query = `
      CREATE (borrow:Borrow {title: $title, borrowerName: $borrowerName, borrowDate: $borrowDate, returnDate: $returnDate})
      RETURN borrow
    `;
    const params = { title, borrowerName, borrowDate, returnDate };
    const result = await this.neo4jService.write(query, params);
    const borrow = result.records[0].get('borrow').properties;

    // Kafka'ya mesaj gönder
    this.kafkaClient.emit('book_borrowed', {
      title: borrow.title,
      borrowerName: borrow.borrowerName,
      borrowDate: borrow.borrowDate,
      returnDate: borrow.returnDate,
    });
    console.log('Kafka mesajı gönderildi:', {
      title: borrow.title,
      borrowerName: borrow.borrowerName,
      borrowDate: borrow.borrowDate,
      returnDate: borrow.returnDate,
    });

    return borrow;
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

  async delete(id: string) {
    const query = `MATCH (borrow:Borrow {title: $title}) DELETE borrow`;
    const params = { id };
    await this.neo4jService.write(query, params);
  }
}
