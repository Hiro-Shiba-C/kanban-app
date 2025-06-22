import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { 
  Dialog, 
  DialogTrigger, 
  DialogContent, 
  DialogHeader, 
  DialogTitle,
  DialogDescription 
} from '@/components/ui/dialog'

describe('Dialog Components', () => {
  describe('Dialog with DialogTrigger and DialogContent', () => {
    const DialogExample = () => (
      <Dialog>
        <DialogTrigger>Open Dialog</DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Test Dialog</DialogTitle>
            <DialogDescription>This is a test dialog</DialogDescription>
          </DialogHeader>
          <p>Dialog content</p>
        </DialogContent>
      </Dialog>
    )

    it('renders trigger button', () => {
      render(<DialogExample />)
      
      const trigger = screen.getByText('Open Dialog')
      expect(trigger).toBeInTheDocument()
    })

    it('does not show dialog content initially', () => {
      render(<DialogExample />)
      
      expect(screen.queryByText('Test Dialog')).not.toBeInTheDocument()
      expect(screen.queryByText('Dialog content')).not.toBeInTheDocument()
    })

    it('opens dialog when trigger is clicked', async () => {
      const user = userEvent.setup()
      render(<DialogExample />)
      
      const trigger = screen.getByText('Open Dialog')
      await user.click(trigger)
      
      expect(screen.getByText('Test Dialog')).toBeInTheDocument()
      expect(screen.getByText('Dialog content')).toBeInTheDocument()
    })

    it('closes dialog when close button is clicked', async () => {
      const user = userEvent.setup()
      render(<DialogExample />)
      
      // Open dialog
      const trigger = screen.getByText('Open Dialog')
      await user.click(trigger)
      
      // Close dialog
      const closeButton = screen.getByTestId('x-icon').closest('button')
      expect(closeButton).toBeInTheDocument()
      
      if (closeButton) {
        await user.click(closeButton)
      }
      
      expect(screen.queryByText('Test Dialog')).not.toBeInTheDocument()
    })

    it('closes dialog when background overlay is clicked', async () => {
      const user = userEvent.setup()
      render(<DialogExample />)
      
      // Open dialog
      const trigger = screen.getByText('Open Dialog')
      await user.click(trigger)
      
      // Click background overlay (the element with bg-black/50)
      const overlay = document.querySelector('.bg-black\\/50')
      expect(overlay).toBeInTheDocument()
      
      if (overlay) {
        await user.click(overlay as Element)
      }
      
      expect(screen.queryByText('Test Dialog')).not.toBeInTheDocument()
    })

    it('closes dialog when Escape key is pressed', async () => {
      const user = userEvent.setup()
      render(<DialogExample />)
      
      // Open dialog
      const trigger = screen.getByText('Open Dialog')
      await user.click(trigger)
      
      expect(screen.getByText('Test Dialog')).toBeInTheDocument()
      
      // Press Escape
      await user.keyboard('{Escape}')
      
      expect(screen.queryByText('Test Dialog')).not.toBeInTheDocument()
    })
  })

  describe('Controlled Dialog', () => {
    const ControlledDialog = ({ open, onOpenChange }: { 
      open: boolean; 
      onOpenChange: (open: boolean) => void 
    }) => (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogTrigger>Open Controlled Dialog</DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Controlled Dialog</DialogTitle>
          </DialogHeader>
          <p>Controlled content</p>
        </DialogContent>
      </Dialog>
    )

    it('respects external open state', () => {
      render(<ControlledDialog open={true} onOpenChange={jest.fn()} />)
      
      expect(screen.getByText('Controlled Dialog')).toBeInTheDocument()
    })

    it('calls onOpenChange when close button is clicked', async () => {
      const user = userEvent.setup()
      const onOpenChange = jest.fn()
      
      render(<ControlledDialog open={true} onOpenChange={onOpenChange} />)
      
      const closeButton = screen.getByTestId('x-icon').closest('button')
      if (closeButton) {
        await user.click(closeButton)
      }
      
      expect(onOpenChange).toHaveBeenCalledWith(false)
    })
  })

  describe('Dialog Header Components', () => {
    it('renders DialogTitle with correct styling', () => {
      render(
        <DialogHeader>
          <DialogTitle>Test Title</DialogTitle>
        </DialogHeader>
      )
      
      const title = screen.getByText('Test Title')
      expect(title).toBeInTheDocument()
      expect(title.tagName).toBe('H3')
    })

    it('renders DialogDescription with correct styling', () => {
      render(
        <DialogHeader>
          <DialogDescription>Test description</DialogDescription>
        </DialogHeader>
      )
      
      const description = screen.getByText('Test description')
      expect(description).toBeInTheDocument()
      expect(description.tagName).toBe('P')
    })
  })
})