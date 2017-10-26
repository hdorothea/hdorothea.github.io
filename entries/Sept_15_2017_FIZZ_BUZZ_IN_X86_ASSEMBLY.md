A year ago I went through a phase of trying to understand how computers work from the bottom up. 

I worked through parts of [From Nand to Tetris](https://www.coursera.org/learn/build-a-computer) and parts of [Programming from the Ground Up](https://download-mirror.savannah.gnu.org/releases/pgubook/ProgrammingGroundUp-1-0-booksize.pdf) which is still one of my all time favorite programming books.

As the culmination of this phase I wrote a FizzBuzz program in x86 assembly. Recently I stumbled upon it on my computer.  Reading through it I was like 'wow this is good you can kind of figure out what is happening even if you don't know assembly' which was my intention when writing it in the first place. 

I thought it might be useful to other people so I am giving it a better home on this blog. It is written in the AT&T syntax. 

If you have never read an assembly program before you should know one thing: instructions generally operate on registers. The entire program is basically a big dance of moving around constants and things saved at memory locations and registers to different registers and then calling instructions on them. If this confused you and I am sure it did, just read on.

In the first section we label certain memory locations and set their values.
```
.section .data

number:
.quad 0 # we start out with 0

fizz_output:
.ascii "Fizz\n"

buzz_output:
.ascii "Buzz\n"

fizzbuzz_output:
.ascii "FizzBuzz\n"

number_output:
.ascii "  \n"

# constants
.equ FIZZ_LENGTH, 8
.equ BUZZ_LENGTH, 4
.equ NUMBER_OUTPUT_LENGTH, 3
.equ FIZZBUZZ_LENGTH, 11
.equ FIZZ_NUMBER, 3
.equ BUZZ_NUMBER, 5
.equ BASE, 10

.equ SYS_WRITE, 4 # write system call number
.equ SYS_EXIT, 1 # exit system call number
.equ STDOUT, 1 # file descriptor
.equ LINUX_SYSCALL, 0x80

# stack positions
.equ ST_OUTPUT_LENGTH, -8 # outputlength
.equ ST_OUTPUT_ADDRESS, -16 # outputaddress
.equ ST_NUMBER_OFFSET, -24 # numberoffset
.equ ST_FIZZ_BOOL, -25 # fizzbool
.equ ST_BUZZ_BOOL, -26 # buzzbool
.equ ST_FIZZBUZZ_BOOL, -27 # fizzbuzzbool
.equ ST, 27

```
The next section is the actual program instructions.
```
.section .text
```

This .globl _start here is important because it lets the computer know from where to start running your instructions.
```
.globl _start
```
Don't mind the stack business here too much. Since I don't even use functions in this program it wouldn't have been necessary.
```
_start:
movq  %rsp, %rbp # save the stack pointer
subq  $ST, %rsp # allocate space for stack variables
```

Here we label the start of the loop. If you scroll farther down towards the end of the program we have an instruction ```jmp loop``` that jumps back to this position in the program and continues executing from here.
```
loop:
```
 At the beginning of the loop we (re)set the values at the fizz_bool and buzz_bool memory locations. We move the value 0 to the al register.
```
movb $0, %al
```
And then move the value at the al register which now is 0 to the fizz_bool memory location. The reason that we didn't directly move the value 0 to the memory location is that move instructions need to involve at least one register.
```
movb %al, ST_FIZZ_BOOL(%rbp)
```
Same thing for the buzz_bool memory location.
```
movb $0, %al
movb %al, ST_BUZZ_BOOL(%rbp)
```

The next two instructions come as a pair. First we compare the memory location ```number``` (we had set this to 0 in the data section above and at the end of the loop farther down we also have a ```incq number``` instruction which increments the value at this memory location) to the value 100. The ALU sets a couple special purpose registers when executing the comparison instruction indicating if the first value was greater, equal or less than the second one and uses those registers for the folowing instruction.

Compare the current value at the number memory location to the value 100.
```
cmpq $100, number
```
If it is greater jump to leave.
```
jg leave 
```
Next we need to set the memory location fizz_bool to the correct value. To do that we need to divide the value saved at the memory location number with 3. Divisions are a little complicated.

We empty the register rdx for the division.
```
movq $0, %rdx
```
The value at the memory location number is the dividend. It needs to be in the rax register.
```
movq number, %rax
```
3 is the divisor. Move it to any register.
```
movq $FIZZ_NUMBER, %rbx
```
Perform the division.
```
divq %rbx 
```
Compare the remainder of the division(in the rdx register) with the value 0.
If it is not 0 jump to set_up_buzz_bool. If it is 0 set fizz_bool to 1.
```
cmpq $0, %rdx 
jne set_up_buzz_bool 
movb $1, %al
movb %al, ST_FIZZ_BOOL(%rbp) 
```
We do the exact same thing for the buzz_bool memory location.
```
set_up_buzz_bool:
movq $0, %rdx
movq number, %rax
movq $BUZZ_NUMBER, %rbx 
divq %rbx
```
If it is not 0 jump to set_up_fizzbuzz_bool. If it is 0 set buzz_bool to 1.
```
cmpq $0, %rdx
jne set_up_fizzbuzz_bool
movb $1, %al
movb %al, ST_BUZZ_BOOL(%rbp) # set buzzbool to 1
```
Then we set the memory location fizzbuzz_bool to the correct value.
```
set_up_fizzbuzz_bool:
```
Move the value at the fizz_bool memory location to any general purpose register.
```
movb ST_FIZZ_BOOL(%rbp), %al
```
Compute 'logical and' of the values at fizzbool and buzzbool memory locations.
```
andb ST_BUZZ_BOOL(%rbp), %al
```
Set the fizzbuzz_bool memory location to the result of the 'logical and' of fizzbool and buzzbool.
```
movb %al, ST_FIZZBUZZ_BOOL(%rbp)
```
Then we check if the fizzbuzz_bool memory location is set to 1. If not we jump to the is_it_fizz_output memory location. If it is we set the memory location output_address to the address of the memory location fizzbuzz_output (we defined this location in the data section to  have the value "FizzBuzz\n") and the memory location output length to the value at fizzbuzz_length (which we defined in the data section to be 11) .Then we jump to write_output. We again have to perform the dance with the registers because a move operation needs to involve at least one register.
```
is_it_fizzbuzz_output:
```
Move fizzbuzzbool to any general purpose register.
```
movb ST_FIZZBUZZ_BOOL(%rbp), %al 
```
Compare fizzbuzzbool with 1.
```
cmpb $1, %al 
```
If it is not 1 jump to is_it_fizz_output.
```
jne is_it_fizz_output
```
Move the address where the string FizzBuzz is located to any general purpose register.
```
movq $fizzbuzz_output, %rax 
```
Set the value at the output_address memory location to the address of fizzbuzz_output.
```
movq %rax, ST_OUTPUT_ADDRESS(%rbp)
```
Move the value at memory location fizzbuzz_length to any general purpose register.
```
movq $FIZZBUZZ_LENGTH, %rax
```
Set the value at memory location outputlength to the length of the string FizzBuzz.
```
movq %rax, ST_OUTPUT_LENGTH(%rbp)
```
Jump to write_output.
```
jmp write_output
```
This is basically the same thing as above only for Fizz as output.
```
is_it_fizz_output:
movb ST_FIZZ_BOOL(%rbp), %al
cmpb $1, %al
jne is_it_buzz_output
movq $fizz_output, %rax
movq %rax, ST_OUTPUT_ADDRESS(%rbp) 
movq $FIZZ_LENGTH, %rax
movq %rax, ST_OUTPUT_LENGTH(%rbp)
jmp write_output
```
Again the same thing for when we need to output Bazz.
```
is_it_buzz_output:
movb ST_BUZZ_BOOL(%rbp), %al
cmpb $1, %al
jne set_up_number_output 
movq $buzz_output, %rax
movq %rax, ST_OUTPUT_ADDRESS(%rbp)
movq $BUZZ_LENGTH, %rax
movq %rax, ST_OUTPUT_LENGTH(%rbp)
jmp write_output
```
If it was neither FizzBuzz nor Fizz nor Bazz our output is the number. If we have a number with a single digit that has to be the first thing in the buffer. If we have two digits we first have to have the second digit then the first. To figure out if we have a one digit number we again perform a division.
```
set_up_number_output:
movq $0, %rax
```
Set the numberoffset to 0. We need this to insert the digits in the correct location of the buffer.
```
movq %rax, ST_NUMBER_OFFSET(%rbp)
```
Empty  the rdx register for the division.
```
movq $0, %rdx
```
The number is the dividend it needs to be in the register rax.
```
movq number, %rax
```
10 is the divisor move it to any memory location.
```
movq $BASE, %rbx
```
Perform the division
```
divq %rbx
```
The result of the divison in the register rax indicates if we have a single digit number. Compare it with 0.
```
cmpq $0, %rax
```
If it is 0 we have a single digit number. Jump to zeroth_digit.
```
je zeroth_digit
```
If not we get the ascii code of the first digit by adding 48 to the digit.
```
addq $48, %rax
```
Move the result to number_output.
```
movb %al, number_output
```
Add 1 to number_offset. Because we will need to insert the next digit with an offset.
```
addq $1, ST_NUMBER_OFFSET(%rbp)
```
```
zeroth_digit:
```
The remainder of the divison in the register rdx is the 0th digit. Get its ascii code.
```
addq $48, %rdx
```
Move the value at the number_offset memory location to any register.
```
movq ST_NUMBER_OFFSET(%rbp), %rax
```
Move the zeroth digit to number_output plus number_offset
```
movb %dl, number_output(%rax)
```
Here we do the same thing we did above with the string outputs. We set the memory locations output_length and output_address to the correct values.
```
movq $number_output, %rax
movq %rax, ST_OUTPUT_ADDRESS(%rbp)
movq $NUMBER_OUTPUT_LENGTH, %rax
movq %rax, ST_OUTPUT_LENGTH(%rbp)
```
And now we got everything ready for our grand finale. We got our output_address memory location set to the correct address (to a buffer with the ascii values Fizz, Buzz, FizzBuzz or the correct number) and we have the correct length of that buffer saved at the output_length location. What we now want to do is to let the kernel know that we want to write something to a file. And not any file we want to write to the standard output as the shell reads from there and we want to print out our results in the terminal. To do this we will make a system call to the kernel. For the kernel to know what it should do we have to have the write system call number in the register rax. Depending on which system call we want to do we also have to have certain other values in other registers i.e for the write system call the file descriptor (in our case the standard output file descriptor which is 1) needs to be in the register rbx, the starting adress of the buffer we want to write needs to be in the rcx register and the length of the buffer we want to write needs to be in the rdx register. Now all of our preparations pay off.
```
write_output:
```
The (write) system call number needs to be in the register rax.
```
movq $SYS_WRITE, %rax
```
The (standard output) file descriptor needs to be in the register rbx.
```
movq $STDOUT, %rbx 
```
The starting address of the buffer to write needs to be in the register rcx.
```
movq ST_OUTPUT_ADDRESS(%rbp), %rcx
```
The length of the buffer to write needs to be in the register rdx.
```
movq ST_OUTPUT_LENGTH(%rbp), %rdx
```
And then we finally call the kernel. 
```
int $LINUX_SYSCALL
```
We increment the value located at the memory location number.
```
incq number
```
And jump back to the beginning of the loop.
```
jmp loop
```
When we break out of the loop we need to let the kernel know that the program has finished running. We again put the system call number (in this case it is 1 for the exit system call) to the register rax and then call the kernel.
```
leave:
movq $SYS_EXIT, %rax
int $LINUX_SYSCALL 
```