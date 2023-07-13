package main

import (
	"fmt"
)

// Query interval
type query struct {
	firstIndex uint64
	lastIndex  uint64
}

type update struct {
	index uint64
	value int
}

func main() {
	fmt.Println(22)
	sqrtSqrtDecompositionTestData := []struct {
		description string
		array       []int
		updates     []update
		queries     []query
		expected    []int
	}{
		{
			description: "test 1-sized array",
			array:       []int{1},
			queries:     []query{{0, 1}},
			expected:    []int{1},
		},
		{
			description: "test array with size 5",
			array:       []int{1, 2, 3, 4, 5},
			queries:     []query{{0, 5}, {0, 2}, {2, 4}},
			expected:    []int{15, 3, 7},
		},
		{
			description: "test array with size 5 and updates",
			array:       []int{1, 2, 3, 4, 5},
			updates: []update{
				{index: 1, value: 3},
				{index: 2, value: 4},
			},
			queries:  []query{{0, 5}, {0, 2}, {2, 4}},
			expected: []int{17, 4, 8},
		},
		{
			description: "test array with size 11 and updates",
			array:       []int{1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1},
			updates: []update{
				{index: 2, value: 2},
				{index: 3, value: 3},
				{index: 6, value: 6},
			},
			queries:  []query{{3, 5}, {7, 8}, {3, 7}, {0, 10}},
			expected: []int{4, 1, 11, 18},
		},
	}
	for _, test := range sqrtSqrtDecompositionTestData {
		s := goji.NewSqrtDecomposition(test.array,
			func(e int) int { return e },
			func(q1, q2 int) int { return q1 + q2 },
			func(q, a, b int) int { return q - a + b },
		)

		for i := 0; i < len(test.updates); i++ {
			s.Update(test.updates[i].index, test.updates[i].value)
		}

		for i := 0; i < len(test.queries); i++ {
			result := s.Query(test.queries[i].firstIndex, test.queries[i].lastIndex)

			result = result
		}
	}
}
