import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { Neo4jDatabaseModule } from './neo4j/neo4j.module';
import { BorrowModule } from './borrow/borrow.module';
@Module({
  imports: [Neo4jDatabaseModule, BorrowModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
