import { Injectable } from '@nestjs/common';
import { Neo4jService } from 'nest-neo4j';
import { CreateCategoryDto } from './dto/create-category.dto';
import { DeleteCategoryDto } from './dto/delete-category.dto';

@Injectable()
export class CategoryService {
  constructor(private readonly neo4jService: Neo4jService) {}

  async create(createCategoryDto: CreateCategoryDto) {
    const { categoryName } = createCategoryDto;
    const session = this.neo4jService.getWriteSession();
    const transaction = session.beginTransaction();

    try {
      // Kategori oluşturma
      const categoryQuery = `
        CREATE (category:Category {categoryName: $categoryName})
        RETURN category
      `;
      const categoryParams = { categoryName };
      const categoryResult = await transaction.run(
        categoryQuery,
        categoryParams,
      );
      const categoryNode = categoryResult.records[0].get('category');
      const categoryId = categoryNode.identity.toNumber();

      // Mevcut CATEGORIES node'unu bul ve yeni kategoriyi bağla
      const categoriesCategoryLinkQuery = `
       match (c:Categories)
       match (cc:Category) where id(cc)= $categoryId
       create (c)-[:HAS_CATEGORY]->(cc)
      `;
      const categoriesCategoryLinkParams = { categoryId };
      await transaction.run(
        categoriesCategoryLinkQuery,
        categoriesCategoryLinkParams,
      );

      await transaction.commit();
      return categoryNode.properties;
    } catch (error) {
      await transaction.rollback();
      throw error;
    } finally {
      await session.close();
    }
  }

  async delete(deleteCategoryDto: DeleteCategoryDto) {
    const { categoryName } = deleteCategoryDto;
    const session = this.neo4jService.getWriteSession();
    const transaction = session.beginTransaction();

    try {
      // Kategori node'unun varlığını kontrol et
      const checkCategoryQuery = `
        MATCH (category:Category {categoryName: $categoryName})
        RETURN category
      `;
      const checkParams = { categoryName };
      const checkResult = await transaction.run(
        checkCategoryQuery,
        checkParams,
      );

      if (checkResult.records.length === 0) {
        throw new Error('Category not found');
      }

      // Kategori node'una ait tüm ilişkileri sil
      const deleteRelationshipsQuery = `
        MATCH (category:Category {categoryName: $categoryName})-[r]-()
        DELETE r
      `;
      await transaction.run(deleteRelationshipsQuery, checkParams);

      // Kategori node'unu sil
      const deleteCategoryQuery = `
        MATCH (category:Category {categoryName: $categoryName})
        DELETE category
      `;
      await transaction.run(deleteCategoryQuery, checkParams);

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
      MATCH (category:Category)
      RETURN category
    `;
    const result = await this.neo4jService.read(query);
    return result.records.map((record) => record.get('category').properties);
  }

  async findBooksInCategory(categoryName: string) {
    const query = `
      MATCH (category:Category {categoryName: $categoryName})-[:HAS_CATEGORY]->(book:Book)
      RETURN book
    `;
    const params = { categoryName };
    const result = await this.neo4jService.read(query, params);
    return result.records.map((record) => record.get('book').properties);
  }
}
