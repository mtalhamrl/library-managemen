import { Injectable } from '@nestjs/common';
import { Neo4jService } from 'nest-neo4j';
import { CreateBlockDto } from './dto/create-block.dto';
import { DeleteBlockDto } from './dto/delete-block.dto';
@Injectable()
export class BlockService {
  constructor(private readonly neo4jService: Neo4jService) {}
  async create(createBlockDto: CreateBlockDto) {
    const { blockCode } = createBlockDto;
    const session = this.neo4jService.getWriteSession();
    const transaction = session.beginTransaction();

    try {
      //block oluşturma
      const createBlock = `
          create (block:Block {blockCode: $blockCode})
          return block
      `;
      const blockParams = { blockCode };
      const blockResult = await transaction.run(createBlock, blockParams);
      const blockNode = blockResult.records[0].get('block');
      const blockId = blockNode.identity.toNumber();

      //mevcut blockCode'yi bul ve structure'ya bağla
      const blockToStructureLinkQuery = `
      match (s:Structure)
       match (b:Block) where id(b)= $blockId
       create (s)-[:HAS_BLOCK]->(b)
      `;
      const blockToStructureLinkParams = { blockId };
      await transaction.run(
        blockToStructureLinkQuery,
        blockToStructureLinkParams,
      );
      await transaction.commit();
      return blockNode.properties;
    } catch (error) {
      await transaction.rollback();
      throw error;
    } finally {
      await session.close();
    }
  }

  async delete(deleteBlockDto: DeleteBlockDto) {
    const { blockCode } = deleteBlockDto;
    const session = this.neo4jService.getWriteSession();
    const transaction = session.beginTransaction();

    try {
      // Block node'unun varlığını kontrol et
      const checkBlockQuery = `
        MATCH (block:Block {blockCode: $blockCode})
        RETURN block
      `;
      const checkParams = { blockCode };
      const checkResult = await transaction.run(checkBlockQuery, checkParams);

      if (checkResult.records.length === 0) {
        throw new Error('Block not found');
      }

      // Block node'una ait tüm ilişkileri sil
      const deleteRelationshipsQuery = `
        MATCH (block:Block {blockCode: $blockCode})-[r]-()
        DELETE r
      `;
      await transaction.run(deleteRelationshipsQuery, checkParams);

      // Block node'unu sil
      const deleteBlockQuery = `
        MATCH (block:Block {blockCode: $blockCode})
        DELETE block
      `;
      await transaction.run(deleteBlockQuery, checkParams);

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
      MATCH (block:Block)
      RETURN block
    `;
    const result = await this.neo4jService.read(query);
    return result.records.map((record) => record.get('block').properties);
  }

  async findFloorsInBlock(blockCode: string) {
    const query = `
      MATCH (block:Block {blockCode: $blockCode})-[:HAS_FLOOR]->(floor:Floor)
      RETURN floor
    `;
    const params = { blockCode };
    const result = await this.neo4jService.read(query, params);
    return result.records.map((record) => record.get('floor').properties);
  }
}
