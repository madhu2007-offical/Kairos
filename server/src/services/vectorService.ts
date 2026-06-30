// Simple in-memory text similarity search representing a vector DB memory store
interface MemoryDocument {
  id: string;
  text: string;
  metadata: any;
  tokens: string[];
}

class VectorMemoryStore {
  private documents: MemoryDocument[] = [];

  // Helper to tokenize and clean text
  private tokenize(text: string): string[] {
    return text
      .toLowerCase()
      .replace(/[^\w\s]/g, '')
      .split(/\s+/)
      .filter(t => t.length > 2); // filter out short stop-words
  }

  // Calculate TF-IDF-like similarity (cosine similarity on word frequencies)
  private calculateCosineSimilarity(tokens1: string[], tokens2: string[]): number {
    if (tokens1.length === 0 || tokens2.length === 0) return 0;

    const termFrequency = (tokens: string[]) => {
      const counts: Record<string, number> = {};
      tokens.forEach(t => {
        counts[t] = (counts[t] || 0) + 1;
      });
      return counts;
    };

    const tf1 = termFrequency(tokens1);
    const tf2 = termFrequency(tokens2);

    const allTerms = new Set([...Object.keys(tf1), ...Object.keys(tf2)]);
    let dotProduct = 0;
    let magnitude1 = 0;
    let magnitude2 = 0;

    allTerms.forEach(term => {
      const val1 = tf1[term] || 0;
      const val2 = tf2[term] || 0;
      dotProduct += val1 * val2;
      magnitude1 += val1 * val1;
      magnitude2 += val2 * val2;
    });

    magnitude1 = Math.sqrt(magnitude1);
    magnitude2 = Math.sqrt(magnitude2);

    if (magnitude1 === 0 || magnitude2 === 0) return 0;
    return dotProduct / (magnitude1 * magnitude2);
  }

  public addDocument(id: string, text: string, metadata: any = {}) {
    // Remove if exists to prevent duplicates
    this.documents = this.documents.filter(doc => doc.id !== id);
    this.documents.push({
      id,
      text,
      metadata,
      tokens: this.tokenize(text + " " + JSON.stringify(metadata))
    });
  }

  public search(query: string, limit: number = 3): Array<{ id: string; text: string; metadata: any; score: number }> {
    const queryTokens = this.tokenize(query);
    if (queryTokens.length === 0) {
      return this.documents.slice(0, limit).map(doc => ({ id: doc.id, text: doc.text, metadata: doc.metadata, score: 0.1 }));
    }

    const scoredDocs = this.documents.map(doc => {
      const score = this.calculateCosineSimilarity(queryTokens, doc.tokens);
      return {
        id: doc.id,
        text: doc.text,
        metadata: doc.metadata,
        score
      };
    });

    // Sort by descending score
    return scoredDocs
      .filter(doc => doc.score > 0.05) // similarity threshold
      .sort((a, b) => b.score - a.score)
      .slice(0, limit);
  }

  public clear() {
    this.documents = [];
  }
}

export const vectorStore = new VectorMemoryStore();

// Pre-fill memory store with default habits and productivity patterns
vectorStore.addDocument("pattern-1", "User focus peak efficiency is mornings between 9am and 12pm. Procrastination is high for writing tasks after 3pm.", { type: "energy_pattern", timeOfDay: "morning" });
vectorStore.addDocument("pattern-2", "User responds quickly to gentle notifications. Direct, high-intensity warnings trigger anxiety and delay response.", { type: "nudging_preference" });
vectorStore.addDocument("pattern-3", "Emails are usually reviewed in batches at 1pm and 5pm. Calendar holds work best when scheduled in 90-minute blocks.", { type: "work_habit" });
