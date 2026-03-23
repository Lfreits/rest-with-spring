package br.com.techflowhub.repository;

import br.com.techflowhub.model.Books;
import org.springframework.data.jpa.repository.JpaRepository;

public interface BooksRepository extends JpaRepository<Books, Long> {
}