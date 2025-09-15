/* filepath: /d:/Personal/NAVER/web-track-naver-vietnam-ai-hackathon-KiyoshiKoii/src/types/Category.ts */
export interface Category {
    id: string;
    name: string;
    icon: string;
    color: string;
    createdAt: Date;
    isDefault?: boolean;
  }
  
  export interface CategoryStorage {
    version: string;
    categories: Category[];
    metadata: {
      lastModified: string;
      totalCategories: number;
      createdAt: string;
    };
  }