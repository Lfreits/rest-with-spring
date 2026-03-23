package br.com.techflowhub.data.dto;

import br.com.techflowhub.model.Books;
import jakarta.validation.constraints.NotNull;
import org.springframework.hateoas.RepresentationModel;

import java.io.Serializable;
import java.util.Date;
import java.util.Objects;

public class BooksDTO extends RepresentationModel<BooksDTO> implements Serializable {

    private long id;

    private String author;

    @NotNull
    private Date launch_date;

    @NotNull
    private Double price;

    private String title;

    public BooksDTO() {
    }

    public long getId() {
        return id;
    }

    public void setId(long id) {
        this.id = id;
    }

    public String getAuthor() {
        return author;
    }

    public void setAuthor(String author) {
        this.author = author;
    }

    public Date getLaunch_date() {
        return launch_date;
    }

    public void setLaunch_date(Date launch_date) {
        this.launch_date = launch_date;
    }

    public String getTitle() {
        return title;
    }

    public void setTitle(String title) {
        this.title = title;
    }

    public Double getPrice() {
        return price;
    }

    public void setPrice(Double price) {
        this.price = price;
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (o == null || getClass() != o.getClass()) return false;
        BooksDTO entity = (BooksDTO) o;
        return Objects.equals(this.id, entity.id) &&
                Objects.equals(this.author, entity.author) &&
                Objects.equals(this.launch_date, entity.launch_date) &&
                Objects.equals(this.price, entity.price) &&
                Objects.equals(this.title, entity.title);
    }

    @Override
    public int hashCode() {
        return Objects.hash(id, author, launch_date, price, title);
    }
}