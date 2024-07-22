import { Injectable, OnModuleInit } from '@nestjs/common';
import {
  ClientKafka,
  Transport,
  Client,
  MessagePattern,
} from '@nestjs/microservices';
import { Payload } from '@nestjs/microservices';
import { Neo4jService } from 'nest-neo4j';
import { CreateBookDto } from '../dto/create-book.dto';
import { DeleteBookDto } from '../dto/delete-book.dto';
import { UpdateBookDto } from '../dto/update-book.dto';

@Injectable()
export class BookService {
  constructor(private readonly neo4jService: Neo4jService) {}

  async updateBookStatus(title: string, status: string) {
    const query = `
      MATCH (book:Book {title: $title})
      SET book.status = $status
      RETURN book
    `;
    const params = { title, status };
    await this.neo4jService.write(query, params);
  }

  async create(createBookDto: CreateBookDto) {
    const {
      title,
      author,
      publisher,
      category,
      shelfName,
      bookshelfName,
      floorNumber,
      blockCode,
    } = createBookDto;
    const session = this.neo4jService.getWriteSession();
    const transaction = session.beginTransaction();

    try {
      // Gerekli node'ların varlığını kontrol et
      const existenceCheckQuery = `
        OPTIONAL MATCH (sh:Shelf {shelfName: $shelfName})
        OPTIONAL MATCH (bs:Bookshelf {bookshelfName: $bookshelfName})
        OPTIONAL MATCH (fl:Floor {floorNumber: $floorNumber})
        OPTIONAL MATCH (bl:Block {blockCode: $blockCode})
        OPTIONAL MATCH (cat:Category {categoryName: $category})
        RETURN sh, bs, fl, bl, cat
      `;
      const checkParams = {
        shelfName,
        bookshelfName,
        floorNumber,
        blockCode,
        category,
      };
      const checkResult = await transaction.run(
        existenceCheckQuery,
        checkParams,
      );
      const [sh, bs, fl, bl, cat] = checkResult.records[0].values();

      if (!sh || !bs || !fl || !bl || !cat) {
        throw new Error('One or more required nodes do not exist.');
      }

      // Kitap node'u oluşturma
      const bookQuery = `
        CREATE (book:Book {title: $title, author: $author, publisher: $publisher})
        RETURN book
      `;
      const bookParams = { title, author, publisher };
      const bookResults = await transaction.run(bookQuery, bookParams);
      const bookNode = bookResults.records[0].get('book');
      const bookId = bookNode.identity.toNumber();

      // Books node'u ile kitap node'u arasında HAS_BOOK ilişkisi oluşturma
      const booksLinkQuery = `
        MATCH (books:Books)
        MATCH (book:Book) WHERE id(book) = $bookId
        CREATE (books)-[:HAS_BOOK]->(book)
        RETURN books, book
      `;
      const booksLinkParams = { bookId };
      await transaction.run(booksLinkQuery, booksLinkParams);

      // Book ile Category arasında BELONG_TO_CATEGORY ilişkisi oluşturma
      const categoryLinkQuery = `
        MATCH (cat:Category {categoryName: $category}) 
        MATCH (book:Book) WHERE id(book) = $bookId
        CREATE (book)-[:BELONG_TO_CATEGORY]->(cat)
        RETURN book, cat
      `;
      const categoryLinkParams = { category, bookId };
      await transaction.run(categoryLinkQuery, categoryLinkParams);

      // Kitap ile raf arasında ilişki oluşturma
      const shelfQuery = `
        MATCH (sh:Shelf {shelfName: $shelfName})
        MATCH (book:Book) WHERE id(book) = $bookId
        CREATE (book)-[:BELONGS_TO_SHELF]->(sh)
        RETURN book, sh
      `;
      const shelfParams = { shelfName, bookId };
      await transaction.run(shelfQuery, shelfParams);

      const bookToShelfQuery = `
        MATCH (sh:Shelf {shelfName: $shelfName})
        MATCH (book:Book) WHERE id(book) = $bookId
        CREATE (sh)-[:HAS_BOOK]->(book)
        RETURN sh,book
      `;
      await transaction.run(bookToShelfQuery, shelfParams);
      // Raf ile kitaplık arasında ilişki oluşturma (varsa oluşturma)
      const bookshelfQuery = `
        MATCH (sh:Shelf {shelfName: $shelfName})
        MATCH (bs:Bookshelf {bookshelfName: $bookshelfName})
        MERGE (bs)-[:HAS_SHELF]->(sh)
        RETURN bs, sh
      `;
      const bookshelfParams = { bookshelfName, shelfName };
      await transaction.run(bookshelfQuery, bookshelfParams);

      // Kat ile kitaplık arasında ilişki oluşturma (varsa oluşturma)
      const floorQuery = `
        MATCH (f:Floor {floorNumber: $floorNumber})
        MATCH (bs:Bookshelf {bookshelfName: $bookshelfName})
        MERGE (f)-[:HAS_BOOKSHELF]->(bs)
        RETURN f, bs
      `;
      const floorParams = { floorNumber, bookshelfName };
      await transaction.run(floorQuery, floorParams);

      // Blok ile kat arasında ilişki oluşturma (varsa oluşturma)
      const blockQuery = `
        MATCH (b:Block {blockCode: $blockCode})
        MATCH (f:Floor {floorNumber: $floorNumber})
        MERGE (b)-[:HAS_FLOOR]->(f)
        RETURN b, f
      `;
      const blockParams = { blockCode, floorNumber };
      await transaction.run(blockQuery, blockParams);

      await transaction.commit();
      return bookNode.properties;
    } catch (error) {
      await transaction.rollback();
      throw error;
    } finally {
      await session.close();
    }
  }

  async findAll() {
    const query = `MATCH (book:Book) RETURN book`;
    const result = await this.neo4jService.read(query);
    return result.records.map((record) => record.get('book').properties);
  }

  async delete(deleteBookDto: DeleteBookDto) {
    const session = this.neo4jService.getWriteSession();
    const transaction = session.beginTransaction();
    try {
      // Kitap node'unun varlığını kontrol et
      const checkBookQuery = `
        MATCH (book:Book {title: $title})
        RETURN book
      `;
      const checkParam = { title: deleteBookDto.title };
      const checkResult = await transaction.run(checkBookQuery, checkParam);

      if (checkResult.records.length === 0) {
        throw new Error('Book not found');
      }

      // Kitap node'una ait tüm ilişkileri sil
      const deleteRelationshipsQuery = `
        MATCH (book:Book {title: $title})-[r]-()
        DELETE r
      `;
      await transaction.run(deleteRelationshipsQuery, checkParam);

      // Kitap node'unu sil
      const deleteBookQuery = `
        MATCH (book:Book {title: $title})
        DELETE book
      `;
      await transaction.run(deleteBookQuery, checkParam);

      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      throw error;
    } finally {
      await session.close();
    }
  }

  async updateBookCategory(updateBookDto: UpdateBookDto) {
    const { title, newCategory } = updateBookDto;
    const session = this.neo4jService.getWriteSession();
    const transaction = session.beginTransaction();

    try {
      // Kitap node'unun varlığını kontrol et
      const checkBookQuery = `
        MATCH (book:Book {title: $title})
        RETURN book
      `;
      const checkBookParams = { title };
      const checkBookResult = await transaction.run(
        checkBookQuery,
        checkBookParams,
      );

      if (checkBookResult.records.length === 0) {
        throw new Error('Book not found');
      }

      const bookNode = checkBookResult.records[0].get('book');
      const bookId = bookNode.identity.toNumber();

      // Mevcut kategoriyi kaldır
      const removeCategoryRelationshipQuery = `
        MATCH (book:Book)-[r:BELONG_TO_CATEGORY]->(:Category)
        WHERE id(book) = $bookId
        DELETE r
      `;
      const removeCategoryRelationshipParams = { bookId };
      await transaction.run(
        removeCategoryRelationshipQuery,
        removeCategoryRelationshipParams,
      );

      // Yeni kategoriyi oluştur veya bul
      const categoryQuery = `
        MERGE (cat:Category {categoryName: $newCategory})
        RETURN cat
      `;
      const categoryParams = { newCategory };
      const categoryResult = await transaction.run(
        categoryQuery,
        categoryParams,
      );
      const categoryNode = categoryResult.records[0].get('cat');
      const categoryId = categoryNode.identity.toNumber();

      // Kitap ile yeni kategori arasında ilişki oluştur
      const addCategoryRelationshipQuery = `
        MATCH (book:Book) WHERE id(book) = $bookId
        MATCH (cat:Category) WHERE id(cat) = $categoryId
        CREATE (book)-[:BELONG_TO_CATEGORY]->(cat)
        RETURN book, cat
      `;
      const addCategoryRelationshipParams = { bookId, categoryId };
      await transaction.run(
        addCategoryRelationshipQuery,
        addCategoryRelationshipParams,
      );

      // Yeni kategoriyi CATEGORIES node'una bağla
      const categoriesCategoryLinkQuery = `
        MATCH (categories:CATEGORIES)
        MATCH (cat:Category) WHERE id(cat) = $categoryId
        MERGE (categories)-[:HAS_CATEGORY]->(cat)
        RETURN categories, cat
      `;
      const categoriesCategoryLinkParams = { categoryId };
      await transaction.run(
        categoriesCategoryLinkQuery,
        categoriesCategoryLinkParams,
      );

      await transaction.commit();
      return bookNode.properties;
    } catch (error) {
      await transaction.rollback();
      throw error;
    } finally {
      await session.close();
    }
  }

  async findBookDetails(title: string) {
    const query = `
      MATCH (b:Book {title: $title})
      OPTIONAL MATCH (b)-[:BELONGS_TO_SHELF]->(sh:Shelf)
      OPTIONAL MATCH (sh)<-[:HAS_SHELF]-(bs:Bookshelf)
      OPTIONAL MATCH (bs)<-[:HAS_BOOKSHELF]-(f:Floor)
      OPTIONAL MATCH (f)<-[:HAS_FLOOR]-(bl:Block)
      RETURN b, sh, bs, f, bl
    `;
    const params = { title };
    const result = await this.neo4jService.read(query, params);

    if (result.records.length === 0) {
      throw new Error('Book not found');
    }

    const record = result.records[0];

    return {
      book: record.get('b').properties,
      shelf: record.get('sh') ? record.get('sh').properties : null,
      bookshelf: record.get('bs') ? record.get('bs').properties : null,
      floor: record.get('f') ? record.get('f').properties : null,
      block: record.get('bl') ? record.get('bl').properties : null,
    };
  }
}
