package br.com.techflowhub.services;

import br.com.techflowhub.controllers.BooksController;
import br.com.techflowhub.data.dto.BooksDTO;
import br.com.techflowhub.exception.RequiredObjectIsNullException;
import br.com.techflowhub.exception.ResourceNotFoundException;
import br.com.techflowhub.model.Books;
import br.com.techflowhub.repository.BooksRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;

import static br.com.techflowhub.mapper.ObjectMapper.parseListObjects;
import static br.com.techflowhub.mapper.ObjectMapper.parseObject;
import static org.springframework.hateoas.server.mvc.WebMvcLinkBuilder.linkTo;
import static org.springframework.hateoas.server.mvc.WebMvcLinkBuilder.methodOn;

@Service
public class BooksServices {

    private Logger logger = LoggerFactory.getLogger(BooksServices.class.getName());

    @Autowired
    BooksRepository repository;


    public List<BooksDTO> findAll() {
        logger.info("Finding all Books!");

        var books = parseListObjects(repository.findAll(), BooksDTO.class);
        books.forEach(this::addHateaosLinks);
        return books;
    }

    public BooksDTO findById(Long id) {
        logger.info("Finding one book!");

        var entity = repository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("No records found for this ID!"));
        var dto = parseObject(entity, BooksDTO.class);
        addHateaosLinks(dto);
        return dto;
    }

    public BooksDTO create(BooksDTO book) {

        if(book == null) throw new RequiredObjectIsNullException();

        logger.info("Creating one book!");
        var entity = parseObject(book, Books.class);

        var dto = parseObject(repository.save(entity), BooksDTO.class);
        addHateaosLinks(dto);
        return dto;
    }

    public BooksDTO update(BooksDTO book) {

        if(book == null) throw new RequiredObjectIsNullException();

        logger.info("Updating one Books!");

        Books entity = repository.findById(book.getId())
                .orElseThrow(() -> new ResourceNotFoundException("No records found for this ID!"));

        entity.setAuthor(book.getAuthor());
        entity.setLaunch_date(book.getLaunch_date());
        entity.setPrice(book.getPrice());
        entity.setTitle(book.getTitle());

        var dto = parseObject(repository.save(entity), BooksDTO.class);
        addHateaosLinks(dto);
        return dto;
    }

    public void delete(Long id) {
        logger.info("Deleting one Books!");

        Books entity = repository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("No records found for this ID!"));

        repository.delete(entity);
    }

    private void addHateaosLinks(BooksDTO dto) {
        dto.add(linkTo(methodOn(BooksController.class).findById(dto.getId())).withSelfRel().withType("GET"));
        dto.add(linkTo(methodOn(BooksController.class).findAll()).withRel("findAll").withType("GET"));
        dto.add(linkTo(methodOn(BooksController.class).create(dto)).withRel("create").withType("POST"));
        dto.add(linkTo(methodOn(BooksController.class).update(dto)).withRel("update").withType("PUT"));
        dto.add(linkTo(methodOn(BooksController.class).delete(dto.getId())).withRel("delete").withType("DELETE"));
    }
}
