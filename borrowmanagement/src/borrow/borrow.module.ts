import { Module } from '@nestjs/common';
import { BorrowService } from './borrow.service';
import { BorrowController } from './borrow.controller';
import { Neo4jModule } from 'nest-neo4j';
import { KafkaModule } from '../kafka/kafka.module'; // Kafka modülünü dahil ediyoruz
import { LogsModule } from '../logs/logs.module';
import { LogsService } from 'src/logs/logs.service';

@Module({
  imports: [
    LogsModule,
    Neo4jModule,
    KafkaModule, // Kafka modülünü buraya dahil ediyoruz
  ],
  providers: [BorrowService, LogsService],
  controllers: [BorrowController],
})
export class BorrowModule {}
