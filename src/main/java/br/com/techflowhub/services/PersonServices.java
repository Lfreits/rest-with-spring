package br.com.techflowhub.services;

import br.com.techflowhub.controllers.PersonController;
import br.com.techflowhub.data.dto.PersonDTO;
import br.com.techflowhub.exception.ResourceNotFoundException;
import br.com.techflowhub.model.Person;
import br.com.techflowhub.repository.PersonRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import static org.springframework.hateoas.server.mvc.WebMvcLinkBuilder.linkTo;
import org.springframework.stereotype.Service;

import java.util.List;

import static br.com.techflowhub.mapper.ObjectMapper.parseListObjects;
import static br.com.techflowhub.mapper.ObjectMapper.parseObject;
import static org.springframework.hateoas.server.mvc.WebMvcLinkBuilder.methodOn;


@Service
public class PersonServices {

    private Logger logger = LoggerFactory.getLogger(PersonServices.class.getName());

    @Autowired
    PersonRepository repository;


    public List<PersonDTO> findAll() {
        logger.info("Finding all People!");

        var persons = parseListObjects(repository.findAll(), PersonDTO.class);
        persons.forEach(this::addHateaosLinks);
        return persons;
    }

    public PersonDTO findById(Long id) {
        logger.info("Finding one Person!");

        var entity = repository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("No records found for this ID!"));
        var dto = parseObject(entity, PersonDTO.class);
        addHateaosLinks(dto);
        return dto;
    }

    public PersonDTO create(PersonDTO person) {
        logger.info("Creating one Person!");
        var entity = parseObject(person, Person.class);

        var dto = parseObject(repository.save(entity), PersonDTO.class);
        addHateaosLinks(dto);
        return dto;
    }

    public PersonDTO update(PersonDTO person) {
        logger.info("Updating one Person!");

        Person entity = repository.findById(person.getId())
                .orElseThrow(() -> new ResourceNotFoundException("No records found for this ID!"));

        entity.setFirstName(person.getFirstName());
        entity.setLastName(person.getLastName());
        entity.setAddress(person.getAddress());
        entity.setGender(person.getGender());

        var dto = parseObject(repository.save(entity), PersonDTO.class);
        addHateaosLinks(dto);
        return dto;
    }

    public void delete(Long id) {
        logger.info("Deleting one Person!");

        Person entity = repository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("No records found for this ID!"));

        repository.delete(entity);
    }

    private void addHateaosLinks(PersonDTO dto) {
        dto.add(linkTo(methodOn(PersonController.class).findById(dto.getId())).withSelfRel().withType("GET"));
        dto.add(linkTo(methodOn(PersonController.class).findAll()).withRel("findAll").withType("GET"));
        dto.add(linkTo(methodOn(PersonController.class).create(dto)).withRel("create").withType("POST"));
        dto.add(linkTo(methodOn(PersonController.class).update(dto)).withRel("update").withType("PUT"));
        dto.add(linkTo(methodOn(PersonController.class).delete(dto.getId())).withRel("delete").withType("DELETE"));
    }
}