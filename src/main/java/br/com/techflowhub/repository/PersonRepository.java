package br.com.techflowhub.repository;

import br.com.techflowhub.model.Person;
import org.springframework.data.jpa.repository.JpaRepository;

public interface PersonRepository extends JpaRepository<Person, Long> {}
