// export class dbRepo {
//   private async findBooksWithDetails(title: string) {
//     const query = `
//           MATCH (b:Book {title: $title})
//           OPTIONAL MATCH (b)-[:BELONGS_TO_SHELF]->(sh:Shelf)
//           OPTIONAL MATCH (sh)<-[:HAS_SHELF]-(bs:Bookshelf)
//           OPTIONAL MATCH (bs)<-[:HAS_BOOKSHELF]-(f:Floor)
//           OPTIONAL MATCH (f)<-[:HAS_FLOOR]-(bl:Block)
//           RETURN b, sh, bs, f, bl
//         `;
//     const params = { title };
//     const result = await this.neo4jService.read(query, params);
//     return result;
//   }
// }
