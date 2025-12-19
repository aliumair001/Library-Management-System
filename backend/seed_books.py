
import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
from datetime import datetime


# MongoDB connection (adjust if needed)
MONGODB_URL = "mongodb://localhost:27017"
DATABASE_NAME = "Library_System"


# Sample books data - 20 diverse books across genres
SAMPLE_BOOKS = [
    # Classic Fiction
    {
        "title": "The Great Gatsby",
        "author": "F. Scott Fitzgerald",
        "genre": "Classic Fiction",
        "total_copies": 5,
        "available_copies": 5
    },
    {
        "title": "To Kill a Mockingbird",
        "author": "Harper Lee",
        "genre": "Classic Fiction",
        "total_copies": 4,
        "available_copies": 4
    },
    {
        "title": "1984",
        "author": "George Orwell",
        "genre": "Classic Fiction",
        "total_copies": 6,
        "available_copies": 6,
    },
    {
        "title": "Pride and Prejudice",
        "author": "Jane Austen",
        "genre": "Classic Fiction",
        "total_copies": 3,
        "available_copies": 3
    },
    
    # Science Fiction
    {
        "title": "Dune",
        "author": "Frank Herbert",
        "genre": "Science Fiction",
        "total_copies": 4,
        "available_copies": 4
    },
    {
        "title": "The Martian",
        "author": "Andy Weir",
        "genre": "Science Fiction",
        "total_copies": 5,
        "available_copies": 5
    },
    {
        "title": "Neuromancer",
        "author": "William Gibson",
        "genre": "Science Fiction",
        "total_copies": 3,
        "available_copies": 3
    },
    {
        "title": "Foundation",
        "author": "Isaac Asimov",
        "genre": "Science Fiction",
        "total_copies": 4,
        "available_copies": 4
    },
    
    # Fantasy
    {
        "title": "The Hobbit",
        "author": "J.R.R. Tolkien",
        "genre": "Fantasy",
        "total_copies": 6,
        "available_copies": 6
    },
    {
        "title": "Harry Potter and the Sorcerer's Stone",
        "author": "J.K. Rowling",
        "genre": "Fantasy",
        "total_copies": 8,
        "available_copies": 8
    },
    {
        "title": "The Name of the Wind",
        "author": "Patrick Rothfuss",
        "genre": "Fantasy",
        "total_copies": 4,
        "available_copies": 4
    },
    
    # Mystery/Thriller
    {
        "title": "The Girl with the Dragon Tattoo",
        "author": "Stieg Larsson",
        "genre": "Mystery",
        "total_copies": 5,
        "available_copies": 5
    },
    {
        "title": "Gone Girl",
        "author": "Gillian Flynn",
        "genre": "Thriller",
        "total_copies": 4,
        "available_copies": 4
    },
    {
        "title": "The Da Vinci Code",
        "author": "Dan Brown",
        "genre": "Mystery",
        "total_copies": 5,
        "available_copies": 5
    },
    
    # Non-Fiction
    {
        "title": "Sapiens: A Brief History of Humankind",
        "author": "Yuval Noah Harari",
        "genre": "Non-Fiction",
        "total_copies": 6,
        "available_copies": 6
    },
    {
        "title": "Educated",
        "author": "Tara Westover",
        "genre": "Biography",
        "total_copies": 4,
        "available_copies": 4
    },
    {
        "title": "Atomic Habits",
        "author": "James Clear",
        "genre": "Self-Help",
        "total_copies": 7,
        "available_copies": 7
    },
    
    # Contemporary Fiction
    {
        "title": "The Kite Runner",
        "author": "Khaled Hosseini",
        "genre": "Contemporary Fiction",
        "total_copies": 4,
        "available_copies": 4
    },
    {
        "title": "The Alchemist",
        "author": "Paulo Coelho",
        "genre": "Contemporary Fiction",
        "total_copies": 5,
        "available_copies": 5
    },
    {
        "title": "Life of Pi",
        "author": "Yann Martel",
        "genre": "Contemporary Fiction",
        "total_copies": 3,
        "available_copies": 3
    }
]


async def seed_books():
    """
    Seed the database with sample books.
    """
    
    print(" Starting book seeding process...")
    
    # Connect to MongoDB
    client = AsyncIOMotorClient(MONGODB_URL)
    db = client[DATABASE_NAME]
    books_collection = db.books
    
    try:
        # Check if books already exist
        existing_count = await books_collection.count_documents({})
        
        if existing_count > 0:
            print(f"  Database already contains {existing_count} books.")
            response = input("Do you want to add more books anyway? (y/n): ")
            if response.lower() != 'y':
                print(" Seeding cancelled.")
                return
        
        # Insert sample books
        print(f" Inserting {len(SAMPLE_BOOKS)} books...")
        result = await books_collection.insert_many(SAMPLE_BOOKS)
        
        print(f" Successfully inserted {len(result.inserted_ids)} books!")
        print("\n Sample books added:")
        for i, book in enumerate(SAMPLE_BOOKS, 1):
            print(f"   {i}. {book['title']} by {book['author']} ({book['genre']})")
        
        print("\n  Database seeding complete!")
        print(f" Total books in database: {await books_collection.count_documents({})}")
        
    except Exception as e:
        print(f" Error during seeding: {e}")
    
    finally:
        client.close()
        print(" Database connection closed")


if __name__ == "__main__":
    print("""
     Library Management System - Book Seeding Script
    """)
    
    asyncio.run(seed_books())