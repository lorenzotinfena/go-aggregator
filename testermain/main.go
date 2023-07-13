package main
import (
	"fmt"
)
func main() {
	s := goji.NewSqrtDecomposition(test.array,
		func(e int) int { return e },
		func(q1, q2 int) int { return q1 + q2 },
		func(q, a, b int) int { return q - a + b },
	)
	s=s
}
