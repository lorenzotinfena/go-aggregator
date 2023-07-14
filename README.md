# Go aggregator

This extension is intended to be used with TODO, see that for the usage.

After coding your main.go with third part libraries, this extension let you aggregate all the code in one one file with all the source code self-contained. 

It currently supports only `github.com/lorenzotinfena/goji`.

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

## Known Issues
- all the code (source file + third part libraries) shouldn't import standard libraries with the dot '.'
- all the names in code (source file + third part libraries) must be different