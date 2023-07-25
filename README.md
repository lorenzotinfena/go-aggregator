# vscode extension
# Go aggregator

This extension is intended to be used only by https://github.com/lorenzotinfena/competitive-go, see that for documentation and usage.

# Example

`main.go`
``` Go
package main

import (
	"fmt"
	"github.com/lorenzotinfena/goji"
)

func main() {
	fmt.Println(goji.GCD(20, 23))
}
```
`github.com/lorenzotinfena/goji/math.go`
``` Go
package goji

func Swap(a, b *int) {
	*a, *b = *b, *a
}

func GCD(a, b int) int {
	if b < a {
		Swap(&a, &b)
	}
	for {
		if a == 0 {
			return b
		}
		r := (b % a)
		b = a
		a = r
	}
}
```
The extension will generate

`output.go`
``` Go
// Generated with https://github.com/lorenzotinfena/go-aggregator
// Original source code:
/*
package main

import (
	"fmt"
	"github.com/lorenzotinfena/goji"
)

func main() {
	fmt.Println(goji.GCD(20, 23))
}
*/

package main

import (
	"fmt"
)

func main() {
	fmt.Println(GCD(20, 23))
}

func Swap(a, b *int) {
	*a, *b = *b, *a
}

func GCD(a, b int) int {
	if b < a {
		Swap(&a, &b)
	}
	for {
		if a == 0 {
			return b
		}
		r := (b % a)
		b = a
		a = r
	}
}
```
