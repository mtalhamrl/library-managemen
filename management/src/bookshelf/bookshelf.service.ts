import { Injectable } from '@nestjs/common';
import { Neo4jService } from 'nest-neo4j';
import { CreateBookshelfDto } from './dto/create-bookshelf.dto';
import { DeleteBookshelfDto } from './dto/delete-bookshelf.dto';

@Injectable()
export class BookshelfService {
  constructor(private readonly neo4jService: Neo4jService) {}

  async create(createBookshelfDto: CreateBookshelfDto) {
    const { bookshelfName, floorNumber, blockCode } = createBookshelfDto;
    const session = this.neo4jService.getWriteSession();
    const transaction = session.beginTransaction();

    try {
      // Blok ve Kat varlığını kontrol et
      const checkBlockAndFloorQuery = `
        MATCH (block:Block {blockCode: $blockCode})-[:HAS_FLOOR]->(floor:Floor {floorNumber: $floorNumber})
        RETURN block, floor
      `;
      const checkParams = { blockCode, floorNumber };
      const checkResult = await transaction.run(
        checkBlockAndFloorQuery,
        checkParams,
      );

      if (checkResult.records.length === 0) {
        throw new Error('Block or Floor not found');
      }

      // Kitaplık oluşturma
      const bookshelfQuery = `
        CREATE (bookshelf:Bookshelf {bookshelfName: $bookshelfName})
        RETURN bookshelf
      `;
      const bookshelfParams = { bookshelfName };
      const bookshelfResult = await transaction.run(
        bookshelfQuery,
        bookshelfParams,
      );
      const bookshelfNode = bookshelfResult.records[0].get('bookshelf');
      const bookshelfId = bookshelfNode.identity.toNumber();

      // Kat ile Kitaplık arasında ilişki oluşturma
      const floorBookshelfLinkQuery = `
        MATCH (floor:Floor {floorNumber: $floorNumber})
        MATCH (bookshelf:Bookshelf) WHERE id(bookshelf) = $bookshelfId
        CREATE (floor)-[:HAS_BOOKSHELF]->(bookshelf)
        RETURN floor, bookshelf
      `;
      const floorBookshelfLinkParams = { floorNumber, bookshelfId };
      await transaction.run(floorBookshelfLinkQuery, floorBookshelfLinkParams);

      await transaction.commit();
      return bookshelfNode.properties;
    } catch (error) {
      await transaction.rollback();
      throw error;
    } finally {
      await session.close();
    }
  }

  async delete(deleteBookshelfDto: DeleteBookshelfDto) {
    const { bookshelfName } = deleteBookshelfDto;
    const session = this.neo4jService.getWriteSession();
    const transaction = session.beginTransaction();

    try {
      // Kitaplık node'unun varlığını kontrol et
      const checkBookshelfQuery = `
        MATCH (bookshelf:Bookshelf {bookshelfName: $bookshelfName})
        RETURN bookshelf
      `;
      const checkParams = { bookshelfName };
      const checkResult = await transaction.run(
        checkBookshelfQuery,
        checkParams,
      );

      if (checkResult.records.length === 0) {
        throw new Error('Bookshelf not found');
      }

      // Kitaplık node'una ait tüm ilişkileri sil
      const deleteRelationshipsQuery = `
        MATCH (bookshelf:Bookshelf {bookshelfName: $bookshelfName})-[r]-()
        DELETE r
      `;
      await transaction.run(deleteRelationshipsQuery, checkParams);

      // Kitaplık node'unu sil
      const deleteBookshelfQuery = `
        MATCH (bookshelf:Bookshelf {bookshelfName: $bookshelfName})
        DELETE bookshelf
      `;
      await transaction.run(deleteBookshelfQuery, checkParams);

      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      throw error;
    } finally {
      await session.close();
    }
  }

  async findAll() {
    const query = `
      MATCH (bookshelf:Bookshelf)
      RETURN bookshelf
    `;
    const result = await this.neo4jService.read(query);
    return result.records.map((record) => record.get('bookshelf').properties);
  }

  async findShelvesInBookshelf(bookshelfName: string) {
    const query = `
      MATCH (bookshelf:Bookshelf {bookshelfName: $bookshelfName})-[:HAS_SHELF]->(shelf:Shelf)
      RETURN shelf
    `;
    const params = { bookshelfName };
    const result = await this.neo4jService.read(query, params);
    return result.records.map((record) => record.get('shelf').properties);
  }
}
