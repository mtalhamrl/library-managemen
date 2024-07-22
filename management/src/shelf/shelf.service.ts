import { Injectable } from '@nestjs/common';
import { Neo4jService } from 'nest-neo4j';
import { CreateShelfDto } from './dto/create-shelf.dto';
import { DeleteShelfDto } from './dto/delete-shelf.dto';

@Injectable()
export class ShelfService {
  constructor(private readonly neo4jService: Neo4jService) {}

  async create(createShelfDto: CreateShelfDto) {
    const { shelfName, bookshelfName, floorNumber, blockCode } = createShelfDto;
    const session = this.neo4jService.getWriteSession();
    const transaction = session.beginTransaction();

    try {
      // Blok, Kat ve Kitaplık varlığını kontrol et
      const checkBlockFloorAndBookshelfQuery = `
        MATCH (block:Block {blockCode: $blockCode})-[:HAS_FLOOR]->(floor:Floor {floorNumber: $floorNumber})-[:HAS_BOOKSHELF]->(bookshelf:Bookshelf {bookshelfName: $bookshelfName})
        RETURN block, floor, bookshelf
      `;
      const checkParams = { blockCode, floorNumber, bookshelfName };
      const checkResult = await transaction.run(
        checkBlockFloorAndBookshelfQuery,
        checkParams,
      );

      if (checkResult.records.length === 0) {
        throw new Error('Block, Floor or Bookshelf not found');
      }

      // Raf oluşturma
      const shelfQuery = `
        CREATE (shelf:Shelf {shelfName: $shelfName})
        RETURN shelf
      `;
      const shelfParams = { shelfName };
      const shelfResult = await transaction.run(shelfQuery, shelfParams);
      const shelfNode = shelfResult.records[0].get('shelf');
      const shelfId = shelfNode.identity.toNumber();

      // Kitaplık ile Raf arasında ilişki oluşturma
      const bookshelfShelfLinkQuery = `
        MATCH (bookshelf:Bookshelf {bookshelfName: $bookshelfName})
        MATCH (shelf:Shelf) WHERE id(shelf) = $shelfId
        CREATE (bookshelf)-[:HAS_SHELF]->(shelf)
        RETURN bookshelf, shelf
      `;
      const bookshelfShelfLinkParams = { bookshelfName, shelfId };
      await transaction.run(bookshelfShelfLinkQuery, bookshelfShelfLinkParams);

      await transaction.commit();
      return shelfNode.properties;
    } catch (error) {
      await transaction.rollback();
      throw error;
    } finally {
      await session.close();
    }
  }

  async delete(deleteShelfDto: DeleteShelfDto) {
    const { shelfName } = deleteShelfDto;
    const session = this.neo4jService.getWriteSession();
    const transaction = session.beginTransaction();

    try {
      // Raf node'unun varlığını kontrol et
      const checkShelfQuery = `
        MATCH (shelf:Shelf {shelfName: $shelfName})
        RETURN shelf
      `;
      const checkParams = { shelfName };
      const checkResult = await transaction.run(checkShelfQuery, checkParams);

      if (checkResult.records.length === 0) {
        throw new Error('Shelf not found');
      }

      // Raf node'una ait tüm ilişkileri sil
      const deleteRelationshipsQuery = `
        MATCH (shelf:Shelf {shelfName: $shelfName})-[r]-()
        DELETE r
      `;
      await transaction.run(deleteRelationshipsQuery, checkParams);

      // Raf node'unu sil
      const deleteShelfQuery = `
        MATCH (shelf:Shelf {shelfName: $shelfName})
        DELETE shelf
      `;
      await transaction.run(deleteShelfQuery, checkParams);

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
      MATCH (shelf:Shelf)
      RETURN shelf
    `;
    const result = await this.neo4jService.read(query);
    return result.records.map((record) => record.get('shelf').properties);
  }

  async findBooksInShelf(shelfName: string) {
    const query = `
      MATCH (shelf:Shelf {shelfName: $shelfName})-[:HAS_BOOK]->(book:Book)
      RETURN book
    `;
    const params = { shelfName };
    const result = await this.neo4jService.read(query, params);
    return result.records.map((record) => record.get('book').properties);
  }
}
