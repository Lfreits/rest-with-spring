package br.com.techflowhub;

import br.com.techflowhub.model.Person;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.atomic.AtomicLong;
import java.util.logging.Logger;

@Service
public class PersonServices {

    private final AtomicLong counter = new AtomicLong();

    private Logger logger = Logger.getLogger(PersonServices.class.getName());

    public List<Person> findAll() {
        List<Person> persons = new ArrayList<Person>();

        for (int i = 0; i< 8; i++) {
            Person person = mockPerson(i);
            persons.add(person);
        }

        return persons;
    }

    public Person findById(String id) {
        logger.info("Finding one Person!");

        // Mock de uma pessoa
        Person person = new Person();
        person.setId(counter.incrementAndGet());
        person.setFirstName("Lucas");
        person.setLastName("Melo");
        person.setAddress("Belo Horizonte - MG - Brazil");
        person.setGender("Male");
        return person;
    }

    private Person mockPerson(int i) {
        // Mock de uma lista de pessoas
        Person person = new Person();
        person.setId(counter.incrementAndGet());
        person.setFirstName("First Name " + i);
        person.setLastName("Last Name" + i);
        person.setAddress("Some Address in Brazil" + i);
        person.setGender("Male" + i);
        return person;
    }
}
