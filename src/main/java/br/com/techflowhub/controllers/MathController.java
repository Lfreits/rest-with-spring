package br.com.techflowhub.controllers;

import br.com.techflowhub.exception.UnsupportedMathOperationException;
import br.com.techflowhub.math.SimpleMath;
import br.com.techflowhub.request.converters.NumberConverter;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

// Classe do projeto focada na manipulação de path variables

@RestController
@RequestMapping("/math")
public class MathController {

    private SimpleMath math = new SimpleMath();

    // http://localhost:8080/math/sum/3/5
    @RequestMapping("/sum/{numberOne}/{numberTwo}")
    public Double sum(
            @PathVariable("numberOne") String numberOne,
            @PathVariable("numberTwo") String numberTwo
    ) throws UnsupportedMathOperationException {
        if(!NumberConverter.isNumeric(numberOne) || !NumberConverter.isNumeric(numberTwo))
            throw new UnsupportedMathOperationException("Please, set a numeric value");
        return math.sum(NumberConverter.convertToDouble(numberOne),NumberConverter.convertToDouble(numberTwo));
    }

    // http://localhost:8080/math/sub/3/5
    @RequestMapping("/sub/{numberOne}/{numberTwo}")
    public Double sub(
            @PathVariable("numberOne") String numberOne,
            @PathVariable("numberTwo") String numberTwo
    ) throws UnsupportedMathOperationException {
        if (!NumberConverter.isNumeric(numberOne) || !NumberConverter.isNumeric(numberTwo))
            throw new UnsupportedMathOperationException("Please, set a numeric value");
        return math.subtraction(NumberConverter.convertToDouble(numberOne), NumberConverter.convertToDouble(numberTwo));
    }

    // http://localhost:8080/math/mul/3/5
    @RequestMapping("/mul/{numberOne}/{numberTwo}")
    public Double mul (
            @PathVariable("numberOne") String numberOne,
            @PathVariable("numberTwo") String numberTwo
    ) throws UnsupportedMathOperationException {
        if (!NumberConverter.isNumeric(numberOne) || !NumberConverter.isNumeric(numberTwo))
            throw new UnsupportedMathOperationException("Please, set a numeric value");
        return math.multiplication(NumberConverter.convertToDouble(numberOne), NumberConverter.convertToDouble(numberTwo));
    }

    // http://localhost:8080/math/div/3/5
    @RequestMapping("/div/{numberOne}/{numberTwo}")
    public Double div (
            @PathVariable("numberOne") String numberOne,
            @PathVariable("numberTwo") String numberTwo
    ) throws UnsupportedMathOperationException {
        if (!NumberConverter.isNumeric(numberOne) || !NumberConverter.isNumeric(numberTwo))
            throw new UnsupportedMathOperationException("Please, set a numeric value");
        return math.division(NumberConverter.convertToDouble(numberOne), NumberConverter.convertToDouble(numberTwo));
    }

    // http://localhost:8080/math/mean/3/5
    @RequestMapping("mean/{numberOne}/{numberTwo}")
    public Double mean (
            @PathVariable("numberOne") String numberOne,
            @PathVariable("numberTwo") String numberTwo
    ) throws UnsupportedMathOperationException {
        if (!NumberConverter.isNumeric(numberOne) || !NumberConverter.isNumeric(numberTwo))
            throw new UnsupportedMathOperationException("Please, set a numeric value");
        return math.mean(NumberConverter.convertToDouble(numberOne), NumberConverter.convertToDouble(numberTwo));
    }

    // http://localhost:8080/math/sqrt/3
    @RequestMapping("sqrt/{numberOne}")
    public Double sqrt (
            @PathVariable("numberOne") String numberOne
    ) throws UnsupportedMathOperationException {
        if (!NumberConverter.isNumeric(numberOne))
            throw new UnsupportedMathOperationException("Please, set a numeric value");
        return math.squareRoot(NumberConverter.convertToDouble(numberOne));
    }

}
