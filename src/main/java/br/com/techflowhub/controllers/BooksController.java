package br.com.techflowhub.controllers;

import br.com.techflowhub.controllers.docs.BooksControllerDocs;
import br.com.techflowhub.controllers.docs.PersonControllerDocs;
import br.com.techflowhub.data.dto.BooksDTO;
import br.com.techflowhub.services.BooksServices;
import br.com.techflowhub.services.BooksServices;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("api/books/v1")
@Tag(name = "Books", description = "Endpoints for Managing Books")
public class BooksController implements BooksControllerDocs {

    @Autowired
    private BooksServices service;

    @GetMapping(produces = { MediaType.APPLICATION_JSON_VALUE, MediaType.APPLICATION_XML_VALUE, MediaType.APPLICATION_YAML_VALUE })
    @Override
    public List<BooksDTO> findAll() {
        return service.findAll();
    }

    @GetMapping(value = "/{id}", produces = { MediaType.APPLICATION_JSON_VALUE, MediaType.APPLICATION_XML_VALUE, MediaType.APPLICATION_YAML_VALUE })
    @Override
    public BooksDTO findById(@PathVariable("id") Long id) {
        return service.findById(id);
    }

    @PostMapping(consumes = { MediaType.APPLICATION_JSON_VALUE, MediaType.APPLICATION_XML_VALUE, MediaType.APPLICATION_YAML_VALUE}, produces = { MediaType.APPLICATION_JSON_VALUE, MediaType.APPLICATION_XML_VALUE, MediaType.APPLICATION_YAML_VALUE })
    @Override
    public BooksDTO create(@RequestBody BooksDTO book) {
        return service.create(book);
    }

    @PutMapping(consumes = { MediaType.APPLICATION_JSON_VALUE, MediaType.APPLICATION_XML_VALUE, MediaType.APPLICATION_YAML_VALUE}, produces = { MediaType.APPLICATION_JSON_VALUE, MediaType.APPLICATION_XML_VALUE, MediaType.APPLICATION_YAML_VALUE})
    @Override
    public BooksDTO update(@RequestBody BooksDTO book) {
        return service.update(book);
    }

    @DeleteMapping(value = "/{id}")
    @Override
    public ResponseEntity<?> delete(@PathVariable("id") Long id) {
        service.delete(id);
        return ResponseEntity.noContent().build();
    }
}
