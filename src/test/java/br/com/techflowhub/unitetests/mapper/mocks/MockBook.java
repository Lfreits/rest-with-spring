package br.com.techflowhub.unitetests.mapper.mocks;

import br.com.techflowhub.data.dto.BooksDTO;
import br.com.techflowhub.model.Books;

import java.util.ArrayList;
import java.util.Date;
import java.util.List;

public class MockBook {

    public Books mockEntity() {
        return mockEntity(0);
    }

    public BooksDTO mockDTO() {
        return mockDTO(0);
    }

    public List<Books> mockEntityList() {
        List<Books> books = new ArrayList<Books>();
        for (int i = 0; i < 14; i++) {
            books.add(mockEntity(i));
        }
        return books;
    }

    public List<BooksDTO> mockDTOList() {
        List<BooksDTO> books = new ArrayList<>();
        for (int i = 0; i < 14; i++) {
            books.add(mockDTO(i));
        }
        return books;
    }

    public Books mockEntity(Integer number) {
        Books book = new Books();
        book.setAuthor("Author Test" + number);
        book.setLaunch_date(new Date(1704067200000L));
        book.setPrice(number.doubleValue());
        book.setId(number.longValue());
        book.setTitle("Title Test" + number);
        return book;
    }

    public BooksDTO mockDTO(Integer number) {
        BooksDTO book = new BooksDTO();
        book.setAuthor("Author Test" + number);
        book.setLaunch_date(new Date(1704067200000L));
        book.setPrice(number.doubleValue());
        book.setId(number.longValue());
        book.setTitle("Title Test" + number);
        return book;
    }
}
